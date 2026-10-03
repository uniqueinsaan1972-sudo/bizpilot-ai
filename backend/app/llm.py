"""Single place where we talk to the LLM. Switch providers via LLM_PROVIDER in .env."""
import json
import re
import time

import httpx

from app import config


class LLMError(Exception):
    """API/network failure or missing key."""


class MalformedResponse(LLMError):
    """The model answered, but not with parseable JSON."""


def _post(url: str, headers: dict, body: dict, retries: int | None = None) -> dict:
    last = "unknown error"
    retries = config.LLM_MAX_RETRIES if retries is None else retries
    for attempt in range(retries + 1):
        try:
            r = httpx.post(url, headers=headers, json=body, timeout=config.LLM_TIMEOUT_SECONDS)
            if r.status_code == 200:
                return r.json()
            last = f"HTTP {r.status_code}: {r.text[:300]}"
            if r.status_code not in (429, 500, 502, 503, 529):
                break  # not retryable (bad key, bad request...)
        except httpx.HTTPError as e:
            last = f"network error: {e}"
        if attempt < retries:
            time.sleep(min(3 * (attempt + 1), 9))
    raise LLMError(f"LLM API call failed ({config.LLM_PROVIDER}): {last}")


def _anthropic(system: str, user: str) -> str:
    if not config.ANTHROPIC_API_KEY:
        raise LLMError("ANTHROPIC_API_KEY is not set. Add it to backend/.env")
    data = _post(
        "https://api.anthropic.com/v1/messages",
        {"x-api-key": config.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01",
         "content-type": "application/json"},
        {"model": config.ANTHROPIC_MODEL, "max_tokens": 4000, "temperature": 0.4,
         "system": system, "messages": [{"role": "user", "content": user}]},
    )
    try:
        return "".join(b.get("text", "") for b in data["content"])
    except (KeyError, TypeError):
        raise LLMError(f"Unexpected Anthropic response shape: {str(data)[:200]}")


def _gemini(system: str, user: str) -> str:
    if not config.GEMINI_API_KEY:
        raise LLMError("GEMINI_API_KEY is not set. Add it to backend/.env")
    body = {"systemInstruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": [{"text": user}]}],
            "generationConfig": {"responseMimeType": "application/json", "temperature": 0.4}}
    # If the main model is overloaded (503) or unavailable, automatically try the fallback models.
    models = [config.GEMINI_MODEL] + [m for m in config.GEMINI_FALLBACK_MODELS if m != config.GEMINI_MODEL]
    last_error = LLMError("No Gemini model configured")
    for i, model in enumerate(models):
        try:
            data = _post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={config.GEMINI_API_KEY}",
                {"content-type": "application/json"}, body,
                retries=config.LLM_MAX_RETRIES if i == len(models) - 1 else 1)
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except LLMError as e:
            last_error = e
        except (KeyError, IndexError, TypeError):
            last_error = LLMError(f"Unexpected Gemini response shape from {model}")
    raise last_error


def call_llm(system: str, user: str) -> str:
    if config.LLM_PROVIDER == "anthropic":
        return _anthropic(system, user)
    if config.LLM_PROVIDER == "gemini":
        return _gemini(system, user)
    raise LLMError(f"Unknown LLM_PROVIDER '{config.LLM_PROVIDER}' (use anthropic or gemini)")


def extract_json(text: str) -> dict:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text)
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end <= start:
        raise MalformedResponse("No JSON object found in model response")
    try:
        obj = json.loads(text[start:end + 1])
    except json.JSONDecodeError as e:
        raise MalformedResponse(f"Invalid JSON from model: {e}")
    if not isinstance(obj, dict):
        raise MalformedResponse("Model returned JSON but not an object")
    return obj


def call_llm_json(system: str, user: str) -> dict:
    return extract_json(call_llm(system, user))

"""Base class: every agent = prompt builder + output schema + validation + one repair retry."""
import json

from pydantic import BaseModel, ValidationError

from app import llm

JSON_RULES = (
    "\n\nOUTPUT RULES:\n"
    "- Respond with ONE valid JSON object only. No markdown fences, no commentary.\n"
    "- Follow the JSON schema exactly (field names and types).\n"
    "- Use only the data provided. Never invent figures; if something is unknown, say so.\n"
    "- Money values are plain numbers (no symbols) in the business's currency.\n"
    "- Quote money figures exactly as they appear in the provided data. Never calculate or invent new totals.\n"
)


class AgentError(Exception):
    pass


class BaseAgent:
    name: str = ""
    title: str = ""
    role_prompt: str = ""
    output_model: type[BaseModel]

    def build_prompt(self, ctx: dict) -> str:
        raise NotImplementedError

    def post_process(self, out, ctx: dict):
        return out

    def _system(self) -> str:
        schema = json.dumps(self.output_model.model_json_schema())
        return f"AGENT_ID: {self.name}\n{self.role_prompt}{JSON_RULES}\nJSON SCHEMA:\n{schema}"

    def run(self, ctx: dict):
        system, user = self._system(), self.build_prompt(ctx)
        last_error = ""
        for attempt in range(2):
            prompt = user if attempt == 0 else (
                user + f"\n\nYour previous reply was rejected ({last_error[:300]}). "
                       "Return ONLY a corrected JSON object that matches the schema."
            )
            try:
                raw = llm.call_llm_json(system, prompt)
                return self.post_process(self.output_model.model_validate(raw), ctx)
            except llm.MalformedResponse as e:
                last_error = str(e)
            except ValidationError as e:
                last_error = "; ".join(f"{'.'.join(map(str, x['loc']))}: {x['msg']}" for x in e.errors()[:5])
        raise AgentError(f"{self.title} returned an invalid response twice ({last_error})")


def dump(model) -> str:
    return json.dumps(model.model_dump() if hasattr(model, "model_dump") else model, indent=2)

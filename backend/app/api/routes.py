import json

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import ValidationError

from app import config
from app.orchestrator.pipeline import run_pipeline
from app.schemas import BusinessInput

router = APIRouter(prefix="/api")


def business_form(
    business_name: str = Form(""), industry: str = Form(""), products: str = Form(""),
    target_audience: str = Form(""), monthly_revenue: str = Form(""), monthly_expenses: str = Form(""),
    problem: str = Form(""), goal: str = Form(""), currency: str = Form("PKR"),
) -> BusinessInput:
    try:
        return BusinessInput(
            business_name=business_name, industry=industry, products=products,
            target_audience=target_audience, monthly_revenue=monthly_revenue,
            monthly_expenses=monthly_expenses, problem=problem, goal=goal, currency=currency or "PKR")
    except ValidationError as e:
        errors = [{"field": str(x["loc"][0]), "message": x["msg"]} for x in e.errors()]
        raise HTTPException(422, detail={
            "message": "Please fix: " + "; ".join(f"{x['field']} ({x['message']})" for x in errors),
            "errors": errors})


async def read_csv(csv_file: UploadFile | None) -> bytes | None:
    if csv_file is None or not csv_file.filename:
        return None
    data = await csv_file.read(config.MAX_CSV_BYTES + 1)
    if len(data) > config.MAX_CSV_BYTES:
        raise HTTPException(413, detail={"message": "CSV is too large (max 4 MB)."})
    return data


@router.get("/health")
def health():
    key_set = bool(config.ANTHROPIC_API_KEY if config.LLM_PROVIDER == "anthropic" else config.GEMINI_API_KEY)
    return {"status": "ok", "llm_provider": config.LLM_PROVIDER, "api_key_configured": key_set}


@router.post("/analyze/stream")
async def analyze_stream(business: BusinessInput = Depends(business_form),
                         csv_file: UploadFile | None = File(None)):
    """Server-Sent Events: one event per real agent start/complete."""
    csv_bytes = await read_csv(csv_file)

    def events():
        for ev in run_pipeline(business, csv_bytes):
            yield f"data: {json.dumps(ev)}\n\n"

    return StreamingResponse(events(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.post("/analyze")
async def analyze(business: BusinessInput = Depends(business_form),
                  csv_file: UploadFile | None = File(None)):
    """Non-streaming version: returns the final result in one response (handy for testing)."""
    csv_bytes = await read_csv(csv_file)
    for ev in run_pipeline(business, csv_bytes):
        if ev["type"] == "error":
            raise HTTPException(502 if ev["stage"] != "csv" else 400, detail={"message": ev["message"]})
        if ev["type"] == "final":
            return ev["result"]
    raise HTTPException(500, detail={"message": "Pipeline ended without a result."})

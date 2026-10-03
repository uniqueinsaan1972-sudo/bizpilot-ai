"""End-to-end test of the pipeline with a FAKE LLM (no API key needed).
Proves: CSV -> 5 agents run in order -> each agent really receives the previous outputs.
Run:  python -m tests.smoke_test
"""
import json

from fastapi.testclient import TestClient

from app import llm
from app.data_processing.csv_analyzer import CSVError, analyze_csv
from app.main import app
from app.orchestrator.pipeline import run_pipeline
from app.schemas import BusinessInput

CANNED = {
    "business_analyst": {
        "revenue_analysis": "Revenue is healthy but falling.", "expense_analysis": "Expenses are 64% of revenue.",
        "estimated_monthly_profit": 1, "profit_margin_percent": 1, "sales_trend": "Decreasing",
        "sales_trend_explanation": "Last two months fell.", "best_products": ["Jeans"], "weak_products": ["Accessories"],
        "key_observations": ["obs"], "possible_problems": ["prob"], "main_issue": "MARKER_MAIN_ISSUE",
        "business_health": "fair", "health_score": 55, "confidence": "medium", "limitations": ["lim"]},
    "strategy_agent": {"recommendations": [
        {"title": "MARKER_STRATEGY_TITLE", "reason": "r", "expected_impact": "i", "priority": "high", "timeframe": "30 days"}]},
    "marketing_agent": {
        "campaign_idea": {"name": "MARKER_CAMPAIGN", "concept": "c", "target_channels": ["Instagram"]},
        "instagram_caption": "ig", "facebook_post": "fb", "ad_copy": "ad", "promotional_message": "promo",
        "email_copy": {"subject": "s", "body": "b"}, "sms_copy": "sms"},
    "action_agent": {"tasks": [{"task": "MARKER_TASK", "priority": "High", "deadline": "Within 3 days", "reason": "r"}]},
    "report_agent": {
        "business_health": "Fair", "health_score": 55, "revenue": 0, "expenses": 0, "estimated_profit": 0,
        "sales_trend": "x", "main_problems": ["p"], "key_insights": ["k"], "recommended_strategy": "s",
        "marketing_plan": "m", "action_plan": ["a"], "executive_summary": "summary"},
}
prompts, calls = {}, {"n": 0}


def fake_llm(system, user):
    agent = system.split("AGENT_ID: ")[1].split("\n")[0]
    calls["n"] += 1
    prompts[agent] = user
    if agent == "strategy_agent" and "malformed_once" not in prompts:   # simulate a bad first reply
        prompts["malformed_once"] = True
        return "Sure! here is your strategy (not json)"
    return "```json\n" + json.dumps(CANNED[agent]) + "\n```"


llm.call_llm = fake_llm
biz = BusinessInput(business_name="ABC Clothing", industry="Fashion", target_audience="Young adults",
                    monthly_revenue=500000, monthly_expenses=320000, problem="Sales fell", goal="Grow sales")
csv_bytes = open("sample_data/abc_clothing_sales.csv", "rb").read()

# 1) full pipeline + event order
events = list(run_pipeline(biz, csv_bytes))
kinds = [(e["type"], e.get("agent")) for e in events]
order = ["business_analyst", "strategy_agent", "marketing_agent", "action_agent", "report_agent"]
completed = [a for t, a in kinds if t == "agent_complete"]
assert completed == order, completed
assert events[-1]["type"] == "final"
res = events[-1]["result"]

# 2) data really flows agent -> agent
assert "MARKER_MAIN_ISSUE" in prompts["strategy_agent"]
assert "MARKER_STRATEGY_TITLE" in prompts["marketing_agent"]
assert "MARKER_STRATEGY_TITLE" in prompts["action_agent"] and "MARKER_CAMPAIGN" in prompts["action_agent"]
for m in ("MARKER_MAIN_ISSUE", "MARKER_STRATEGY_TITLE", "MARKER_CAMPAIGN", "MARKER_TASK"):
    assert m in prompts["report_agent"], m
assert "decreasing" in prompts["business_analyst"] and "total_revenue" in prompts["business_analyst"]

# 3) numbers computed in code override LLM guesses; malformed reply was retried
assert res["analysis"]["estimated_monthly_profit"] == 180000 and res["report"]["estimated_profit"] == 180000
assert res["analysis"]["sales_trend"] == "decreasing"
assert calls["n"] == 6   # 5 agents + 1 retry

# 4) error handling
for bad in (b"", b"date,product\n", b"foo,bar\n1,2\n", b"date,revenue\n2026-01-01,abc\n"):
    try:
        analyze_csv(bad); raise SystemExit(f"expected CSVError for {bad!r}")
    except CSVError:
        pass
err = list(run_pipeline(biz, b""))[-1]
assert err["type"] == "error" and err["stage"] == "csv"

def boom(system, user): raise llm.LLMError("API down")
llm.call_llm = boom
err = list(run_pipeline(biz, None))
assert [e["type"] for e in err][-2:] == ["agent_error", "error"]

# 5) HTTP layer
llm.call_llm = fake_llm
client = TestClient(app)
form = {"business_name": "ABC Clothing", "industry": "Fashion", "target_audience": "Young adults",
        "monthly_revenue": "500000", "monthly_expenses": "320000", "problem": "Sales fell", "goal": "Grow"}
r = client.post("/api/analyze", data=form, files={"csv_file": ("s.csv", csv_bytes, "text/csv")})
assert r.status_code == 200 and "report" in r.json(), r.text
r = client.post("/api/analyze/stream", data=form)
assert r.status_code == 200 and r.text.count("agent_complete") == 5
r = client.post("/api/analyze", data={**form, "monthly_revenue": ""})
assert r.status_code == 422 and "monthly_revenue" in r.text
print("ALL SMOKE TESTS PASSED")

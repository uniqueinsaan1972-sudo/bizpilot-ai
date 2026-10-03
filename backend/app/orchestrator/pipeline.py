"""The orchestrator: validates, processes CSV, runs agents in order, passes outputs forward.
Yields events so the API can stream real progress to the frontend."""
import time
from typing import Iterator

from app.agents.action_agent import ActionAgent
from app.agents.business_analyst import BusinessAnalystAgent
from app.agents.marketing_agent import MarketingAgent
from app.agents.report_agent import ReportAgent
from app.agents.strategy_agent import StrategyAgent
from app.data_processing.csv_analyzer import CSVError, analyze_csv
from app.schemas import BusinessInput

AGENTS = [BusinessAnalystAgent(), StrategyAgent(), MarketingAgent(), ActionAgent(), ReportAgent()]

# result key shown to the frontend for each agent
RESULT_KEYS = {"business_analyst": "analysis", "strategy_agent": "strategy", "marketing_agent": "marketing",
               "action_agent": "tasks", "report_agent": "report"}


def run_pipeline(business: BusinessInput, csv_bytes: bytes | None = None) -> Iterator[dict]:
    ctx = {"business": business, "csv_summary": None, "outputs": {}}
    yield {"type": "pipeline_start", "agents": [{"id": a.name, "title": a.title} for a in AGENTS]}

    if csv_bytes is not None:
        try:
            ctx["csv_summary"] = analyze_csv(csv_bytes)
        except CSVError as e:
            yield {"type": "error", "stage": "csv", "message": str(e)}
            return
        yield {"type": "csv_processed", "summary": ctx["csv_summary"]}

    timings = {}
    t_start = time.time()
    for agent in AGENTS:
        yield {"type": "agent_start", "agent": agent.name}
        t0 = time.time()
        try:
            out = agent.run(ctx)
        except Exception as e:  # LLMError, AgentError, anything unexpected
            msg = f"{agent.title} failed: {e}"
            yield {"type": "agent_error", "agent": agent.name, "message": msg}
            yield {"type": "error", "stage": agent.name, "message": msg}
            return
        ctx["outputs"][agent.name] = out
        timings[agent.name] = round(time.time() - t0, 1)
        yield {"type": "agent_complete", "agent": agent.name, "duration_seconds": timings[agent.name],
               "output": out.model_dump()}

    result = {"business": business.model_dump(), "csv_summary": ctx["csv_summary"], "timings": timings,
              "total_seconds": round(time.time() - t_start, 1)}
    for agent_id, key in RESULT_KEYS.items():
        result[key] = ctx["outputs"][agent_id].model_dump()
    yield {"type": "final", "result": result}

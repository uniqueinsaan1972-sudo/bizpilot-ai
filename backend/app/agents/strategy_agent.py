from app.agents.base import BaseAgent, dump
from app.schemas import StrategyOutput


class StrategyAgent(BaseAgent):
    name = "strategy_agent"
    title = "Strategy Agent"
    output_model = StrategyOutput
    role_prompt = (
        "You are a business strategist for small and medium businesses. Using the analyst's findings, "
        "produce 3 to 5 practical strategic recommendations ordered by priority. Every recommendation "
        "needs a reason that references the analysis, an expected business impact (qualitative or a "
        "range - do not fake precision) and a realistic timeframe."
    )

    def build_prompt(self, ctx):
        b = ctx["business"]
        return (f"BUSINESS GOAL: {b.goal}\nCURRENT PROBLEM: {b.problem}\n"
                f"INDUSTRY: {b.industry}\nTARGET AUDIENCE: {b.target_audience}\n\n"
                f"BUSINESS ANALYST OUTPUT:\n{dump(ctx['outputs']['business_analyst'])}")

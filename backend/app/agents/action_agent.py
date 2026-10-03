from app.agents.base import BaseAgent, dump
from app.schemas import ActionOutput


class ActionAgent(BaseAgent):
    name = "action_agent"
    title = "Action Agent"
    output_model = ActionOutput
    role_prompt = (
        "You are an operations coach. Convert the strategy and marketing plan into 6 to 10 concrete "
        "tasks a small business owner can execute, ordered by priority. Each task has a priority "
        "(High/Medium/Low), a relative deadline (e.g. 'Within 3 days', 'Week 2') and a short reason. "
        "Include tasks that execute the marketing campaign."
    )

    def build_prompt(self, ctx):
        b, o = ctx["business"], ctx["outputs"]
        return (f"BUSINESS: {b.business_name} | GOAL: {b.goal}\n\n"
                f"STRATEGY AGENT OUTPUT:\n{dump(o['strategy_agent'])}\n\n"
                f"MARKETING AGENT OUTPUT:\n{dump(o['marketing_agent'])}")

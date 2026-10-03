from app.agents.base import BaseAgent, dump
from app.schemas import ReportOutput


class ReportAgent(BaseAgent):
    name = "report_agent"
    title = "Report Agent"
    output_model = ReportOutput
    role_prompt = (
        "You are the final report writer. Consolidate all previous agent outputs into one coherent "
        "business report. Do not contradict earlier findings or add new facts. The executive summary "
        "is 4-6 sentences for a business owner. action_plan is a list of short strings summarizing "
        "the top tasks with their priority and deadline. Be concise: every list item is one sentence. "
        "Use revenue and expense figures exactly as given in BUSINESS INFORMATION."
    )

    def build_prompt(self, ctx):
        b, o = ctx["business"], ctx["outputs"]
        return (f"BUSINESS INFORMATION:\n{b.model_dump_json(indent=2)}\n\n"
                f"BUSINESS ANALYST OUTPUT:\n{dump(o['business_analyst'])}\n\n"
                f"STRATEGY AGENT OUTPUT:\n{dump(o['strategy_agent'])}\n\n"
                f"MARKETING AGENT OUTPUT:\n{dump(o['marketing_agent'])}\n\n"
                f"ACTION AGENT OUTPUT:\n{dump(o['action_agent'])}")

    def post_process(self, out, ctx):
        b, analysis = ctx["business"], ctx["outputs"]["business_analyst"]
        out.revenue, out.expenses = b.monthly_revenue, b.monthly_expenses
        out.estimated_profit = analysis.estimated_monthly_profit
        out.sales_trend = analysis.sales_trend
        return out

from app.agents.base import BaseAgent, dump
from app.schemas import MarketingOutput


class MarketingAgent(BaseAgent):
    name = "marketing_agent"
    title = "Marketing Agent"
    output_model = MarketingOutput
    role_prompt = (
        "You are a marketing specialist for small businesses. Turn the strategy into ready-to-use "
        "marketing content tailored to the target audience: one campaign idea, an Instagram caption "
        "(with hashtags), a Facebook post, short ad copy, a promotional message, an email (subject "
        "and body) and an SMS under 160 characters. Do not invent discounts the business has not "
        "agreed to - phrase offers as suggestions the owner can adjust (e.g. 'X% off')."
    )

    def build_prompt(self, ctx):
        b = ctx["business"]
        info = (f"Business: {b.business_name}\nIndustry: {b.industry}\nProducts/services: {b.products or 'not specified'}\n"
                f"Target audience: {b.target_audience}\nGoal: {b.goal}")
        return f"BUSINESS INFORMATION:\n{info}\n\nSTRATEGY AGENT OUTPUT:\n{dump(ctx['outputs']['strategy_agent'])}"

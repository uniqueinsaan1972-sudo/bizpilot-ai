import json

from app.agents.base import BaseAgent, dump
from app.schemas import AnalystOutput


class BusinessAnalystAgent(BaseAgent):
    name = "business_analyst"
    title = "Business Analyst"
    output_model = AnalystOutput
    role_prompt = (
        "You are a senior business analyst for small and medium businesses. Analyze the business "
        "information and the CSV summary. Be specific and quantitative. Profit, margin and CSV "
        "numbers were computed in code - treat them as ground truth. The owner-reported monthly revenue is the "
        "headline figure; if the CSV monthly average differs from it by more than 10%, mention the mismatch "
        "in key_observations and limitations. The CSV trend compares the last 2 months with the months before "
        "them (see trend_basis) - never describe it as a 'six-month' decline. Keep every text field concise "
        "(1-3 sentences)."
    )

    def build_prompt(self, ctx):
        b, csv = ctx["business"], ctx["csv_summary"]
        profit = b.monthly_revenue - b.monthly_expenses
        margin = (profit / b.monthly_revenue * 100) if b.monthly_revenue else 0
        facts = {"estimated_monthly_profit": profit, "profit_margin_percent": round(margin, 1),
                 "owner_reported_monthly_revenue": b.monthly_revenue}
        if csv and csv.get("avg_monthly_revenue"):
            facts["csv_avg_monthly_revenue"] = csv["avg_monthly_revenue"]
        csv_part = (f"CSV SALES SUMMARY (computed with Pandas):\n{json.dumps(csv, indent=2)}" if csv else
                    "NO CSV PROVIDED. Base the analysis on the form data only, leave best_products and "
                    "weak_products empty, use sales_trend 'unknown', set confidence to Low or Medium and "
                    "list the missing sales data under limitations.")
        return (f"BUSINESS INFORMATION:\n{b.model_dump_json(indent=2)}\n\n"
                f"PRE-COMPUTED FACTS:\n{json.dumps(facts)}\n\n{csv_part}")

    def post_process(self, out, ctx):
        b, csv = ctx["business"], ctx["csv_summary"]
        out.estimated_monthly_profit = round(b.monthly_revenue - b.monthly_expenses, 2)
        out.profit_margin_percent = round(out.estimated_monthly_profit / b.monthly_revenue * 100, 1) if b.monthly_revenue else 0.0
        if csv and csv["trend"] != "unknown":
            out.sales_trend = csv["trend"]          # deterministic value beats LLM guess
        return out

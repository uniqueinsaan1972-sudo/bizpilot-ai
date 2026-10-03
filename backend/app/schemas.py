"""Input/output schemas for every stage. One source of truth for the whole pipeline."""
from typing import Literal

from pydantic import BaseModel, Field, field_validator


def _strip(v):
    return v.strip() if isinstance(v, str) else v


def _priority(v):
    if isinstance(v, str):
        return {"high": "High", "medium": "Medium", "med": "Medium", "low": "Low"}.get(v.strip().lower(), v)
    return v


# ---------- Pipeline input ----------
class BusinessInput(BaseModel):
    business_name: str = Field(min_length=1, max_length=120)
    industry: str = Field(min_length=1, max_length=120)
    products: str = Field(default="", max_length=1000)
    target_audience: str = Field(min_length=1, max_length=300)
    monthly_revenue: float = Field(ge=0)
    monthly_expenses: float = Field(ge=0)
    problem: str = Field(min_length=1, max_length=1500)
    goal: str = Field(min_length=1, max_length=500)
    currency: str = Field(default="PKR", max_length=10)

    _s = field_validator("business_name", "industry", "products", "target_audience",
                         "problem", "goal", "currency", mode="before")(_strip)


# ---------- Business Analyst ----------
class AnalystOutput(BaseModel):
    revenue_analysis: str
    expense_analysis: str
    estimated_monthly_profit: float
    profit_margin_percent: float
    sales_trend: Literal["increasing", "stable", "decreasing", "unknown"]
    sales_trend_explanation: str
    best_products: list[str] = Field(default_factory=list)
    weak_products: list[str] = Field(default_factory=list)
    key_observations: list[str]
    possible_problems: list[str]
    main_issue: str
    business_health: Literal["Good", "Fair", "Poor"]
    health_score: int = Field(ge=0, le=100)
    confidence: Literal["High", "Medium", "Low"]
    limitations: list[str]

    @field_validator("sales_trend", mode="before")
    @classmethod
    def _lower(cls, v):
        return v.strip().lower() if isinstance(v, str) else v

    @field_validator("business_health", "confidence", mode="before")
    @classmethod
    def _cap(cls, v):
        return v.strip().capitalize() if isinstance(v, str) else v


# ---------- Strategy ----------
class Recommendation(BaseModel):
    title: str
    reason: str
    expected_impact: str
    priority: Literal["High", "Medium", "Low"]
    timeframe: str

    _p = field_validator("priority", mode="before")(_priority)


class StrategyOutput(BaseModel):
    recommendations: list[Recommendation] = Field(min_length=1)


# ---------- Marketing ----------
class CampaignIdea(BaseModel):
    name: str
    concept: str
    target_channels: list[str] = Field(default_factory=list)


class EmailCopy(BaseModel):
    subject: str
    body: str


class MarketingOutput(BaseModel):
    campaign_idea: CampaignIdea
    instagram_caption: str
    facebook_post: str
    ad_copy: str
    promotional_message: str
    email_copy: EmailCopy
    sms_copy: str


# ---------- Action ----------
class Task(BaseModel):
    task: str
    priority: Literal["High", "Medium", "Low"]
    deadline: str
    reason: str

    _p = field_validator("priority", mode="before")(_priority)


class ActionOutput(BaseModel):
    tasks: list[Task] = Field(min_length=1)


# ---------- Report ----------
class ReportOutput(BaseModel):
    business_health: str
    health_score: int = Field(ge=0, le=100)
    revenue: float
    expenses: float
    estimated_profit: float
    sales_trend: str
    main_problems: list[str]
    key_insights: list[str]
    recommended_strategy: str
    marketing_plan: str
    action_plan: list[str]
    executive_summary: str

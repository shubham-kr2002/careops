"""
Analytics Schemas - Pydantic models for analytics API
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class KPIOverview(BaseModel):
    """Key performance indicators overview."""
    total_bookings: int = 0
    total_contacts: int = 0
    booking_conversion_rate: float = 0.0
    form_completion_rate: float = 0.0
    avg_response_time_minutes: float = 0.0
    inventory_health_score: float = 0.0
    revenue_estimate: float = 0.0
    period: str = "30d"


class TrendDataPoint(BaseModel):
    """Single data point in a time series."""
    date: str
    bookings: int = 0
    contacts: int = 0
    forms_completed: int = 0
    revenue: float = 0.0


class TrendsResponse(BaseModel):
    """Time-series trend data."""
    data: List[TrendDataPoint] = []
    period: str = "30d"
    total_data_points: int = 0


class AIInsight(BaseModel):
    """Single AI-generated insight."""
    type: str  # "highlight", "recommendation", "risk"
    title: str
    description: str
    metric: Optional[str] = None
    change_percent: Optional[float] = None


class AIInsightsResponse(BaseModel):
    """AI-generated business insights."""
    summary: str = ""
    highlights: List[AIInsight] = []
    recommendations: List[AIInsight] = []
    risk_areas: List[AIInsight] = []
    method: str = "rule-based"
    period: str = "30d"

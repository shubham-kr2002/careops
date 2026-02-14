"""
Report Schemas - Pydantic models for reports API
"""
from pydantic import BaseModel
from typing import Optional, List


class ReportMetric(BaseModel):
    """Single metric in a report."""
    name: str
    current_value: float = 0.0
    previous_value: float = 0.0
    change_percent: float = 0.0
    status: str = "ok"  # "good", "ok", "risk"


class ReportData(BaseModel):
    """Raw report data."""
    period: str  # "weekly" or "monthly"
    start_date: str
    end_date: str
    metrics: List[ReportMetric] = []


class AIReportSummary(BaseModel):
    """AI-generated report summary."""
    summary: str = ""
    highlights: List[str] = []
    risks: List[str] = []
    recommendations: List[str] = []
    method: str = "rule-based"


class ExportRequest(BaseModel):
    """Report export request."""
    format: str = "csv"  # "csv" or "pdf"
    period: str = "weekly"

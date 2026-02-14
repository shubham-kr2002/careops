"""
Reports Router - Advanced reporting with AI-generated summaries
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
import csv
import io
import json

from app.database import get_db
from app.models.workspace import Workspace
from app.models.user import User
from app.models.booking import Booking, BookingStatus
from app.models.contact import Contact
from app.models.form import BookingForm, FormStatus
from app.models.inventory import InventoryItem
from app.core.dependencies import get_current_user
from app.schemas.report import ReportData, ReportMetric, AIReportSummary
from app.services.ai_service import ai_service

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])


def _get_workspace(db: Session, current_user: User) -> Workspace:
    workspace = db.query(Workspace).filter(Workspace.owner_id == current_user.id).first()
    if not workspace:
        if current_user.workspace_id:
            workspace = db.query(Workspace).filter(Workspace.id == current_user.workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace


def _get_period_metrics(db: Session, workspace_id, start_date: datetime, end_date: datetime):
    """Get raw metrics for a given period."""
    bookings = db.query(func.count(Booking.id)).filter(
        Booking.workspace_id == workspace_id,
        Booking.created_at >= start_date,
        Booking.created_at < end_date,
    ).scalar() or 0

    completed = db.query(func.count(Booking.id)).filter(
        Booking.workspace_id == workspace_id,
        Booking.created_at >= start_date,
        Booking.created_at < end_date,
        Booking.status == BookingStatus.COMPLETED,
    ).scalar() or 0

    contacts = db.query(func.count(Contact.id)).filter(
        Contact.workspace_id == workspace_id,
        Contact.created_at >= start_date,
        Contact.created_at < end_date,
    ).scalar() or 0

    low_stock = db.query(func.count(InventoryItem.id)).filter(
        InventoryItem.workspace_id == workspace_id,
        InventoryItem.total_quantity <= InventoryItem.min_threshold,
    ).scalar() or 0

    return {
        "bookings": bookings,
        "completed_bookings": completed,
        "contacts": contacts,
        "low_stock_items": low_stock,
        "conversion_rate": round((completed / bookings * 100) if bookings > 0 else 0, 1),
    }


def _build_report(db, workspace_id, period_days: int, period_label: str) -> ReportData:
    """Build report data with current vs previous period comparison."""
    now = datetime.now(timezone.utc)
    curr_start = now - timedelta(days=period_days)
    prev_start = curr_start - timedelta(days=period_days)

    curr = _get_period_metrics(db, workspace_id, curr_start, now)
    prev = _get_period_metrics(db, workspace_id, prev_start, curr_start)

    def make_metric(name, curr_val, prev_val):
        change = ((curr_val - prev_val) / prev_val * 100) if prev_val > 0 else 0.0
        status = "good" if change > 5 else ("risk" if change < -5 else "ok")
        return ReportMetric(
            name=name,
            current_value=curr_val,
            previous_value=prev_val,
            change_percent=round(change, 1),
            status=status,
        )

    metrics = [
        make_metric("Total Bookings", curr["bookings"], prev["bookings"]),
        make_metric("Completed Bookings", curr["completed_bookings"], prev["completed_bookings"]),
        make_metric("New Contacts", curr["contacts"], prev["contacts"]),
        make_metric("Conversion Rate", curr["conversion_rate"], prev["conversion_rate"]),
        make_metric("Low Stock Items", curr["low_stock_items"], prev["low_stock_items"]),
    ]

    # Invert status for low stock — more is worse
    if metrics[4].change_percent > 0:
        metrics[4].status = "risk"
    elif metrics[4].change_percent < 0:
        metrics[4].status = "good"

    return ReportData(
        period=period_label,
        start_date=curr_start.strftime("%Y-%m-%d"),
        end_date=now.strftime("%Y-%m-%d"),
        metrics=metrics,
    )


@router.get("/weekly", response_model=ReportData)
def get_weekly_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get weekly report with comparison to previous week."""
    workspace = _get_workspace(db, current_user)
    return _build_report(db, workspace.id, 7, "weekly")


@router.get("/monthly", response_model=ReportData)
def get_monthly_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get monthly report with comparison to previous month."""
    workspace = _get_workspace(db, current_user)
    return _build_report(db, workspace.id, 30, "monthly")


@router.post("/ai-summary", response_model=AIReportSummary)
async def get_ai_report_summary(
    period: str = "weekly",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get AI-generated executive summary for report data."""
    workspace = _get_workspace(db, current_user)
    days = 7 if period == "weekly" else 30
    report = _build_report(db, workspace.id, days, period)

    metrics_dict = {m.name: {"current": m.current_value, "previous": m.previous_value, "change": m.change_percent} for m in report.metrics}

    if ai_service.available:
        try:
            prompt = f"""You are a business operations analyst. Given this {period} report data:
{json.dumps(metrics_dict, indent=2)}

Write a concise 3-paragraph executive summary covering:
1. Overall performance
2. Key highlights and wins
3. Areas needing attention and recommendations

Return ONLY valid JSON:
{{"summary": "full summary text", "highlights": ["point1","point2"], "risks": ["risk1"], "recommendations": ["rec1","rec2"]}}"""

            response = ai_service.groq_client.chat.completions.create(
                model=ai_service.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=500,
                response_format={"type": "json_object"},
            )

            result = json.loads(response.choices[0].message.content)
            return AIReportSummary(
                summary=result.get("summary", ""),
                highlights=result.get("highlights", []),
                risks=result.get("risks", []),
                recommendations=result.get("recommendations", []),
                method="ai",
            )
        except Exception:
            pass

    # Rule-based summary
    highlights = []
    risks = []
    recommendations = []
    summary_parts = [f"This {period} report covers {report.start_date} to {report.end_date}."]

    for m in report.metrics:
        if m.status == "good":
            highlights.append(f"{m.name} improved by {m.change_percent}% to {m.current_value}.")
        elif m.status == "risk":
            risks.append(f"{m.name} declined by {abs(m.change_percent)}% to {m.current_value}.")

    if not highlights:
        highlights.append("Metrics are stable with no significant changes.")
    if risks:
        recommendations.append("Review declining metrics and consider targeted improvements.")
    recommendations.append("Continue monitoring trends weekly for early issue detection.")

    summary_parts.append(f"Total bookings: {report.metrics[0].current_value}. New contacts: {report.metrics[2].current_value}.")

    return AIReportSummary(
        summary=" ".join(summary_parts),
        highlights=highlights,
        risks=risks,
        recommendations=recommendations,
        method="rule-based",
    )


@router.get("/export")
def export_report(
    format: str = "csv",
    period: str = "weekly",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export report as CSV. PDF generation requires additional dependencies."""
    workspace = _get_workspace(db, current_user)
    days = 7 if period == "weekly" else 30
    report = _build_report(db, workspace.id, days, period)

    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Metric", "Current Period", "Previous Period", "Change %", "Status"])
        for m in report.metrics:
            writer.writerow([m.name, m.current_value, m.previous_value, f"{m.change_percent}%", m.status])
        output.seek(0)

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=careops_{period}_report.csv"},
        )

    raise HTTPException(status_code=400, detail="Supported formats: csv")

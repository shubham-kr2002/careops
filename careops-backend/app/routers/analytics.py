"""
Analytics Router - Dashboard analytics with AI insights
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
from collections import defaultdict

from app.database import get_db
from app.models.workspace import Workspace
from app.models.user import User
from app.models.booking import Booking, BookingStatus
from app.models.contact import Contact
from app.models.form import BookingForm, FormStatus
from app.models.inventory import InventoryItem
from app.models.conversation import Conversation, Message
from app.core.dependencies import get_current_user
from app.schemas.analytics import KPIOverview, TrendDataPoint, TrendsResponse, AIInsight, AIInsightsResponse
from app.services.ai_service import ai_service

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])


def _get_workspace(db: Session, current_user: User) -> Workspace:
    """Get the current user's workspace."""
    workspace = db.query(Workspace).filter(Workspace.owner_id == current_user.id).first()
    if not workspace:
        # Also check if user belongs to a workspace as staff
        if current_user.workspace_id:
            workspace = db.query(Workspace).filter(Workspace.id == current_user.workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace


def _parse_period(period: str) -> int:
    """Parse period string to days."""
    mapping = {"7d": 7, "30d": 30, "90d": 90}
    return mapping.get(period, 30)


@router.get("/overview", response_model=KPIOverview)
def get_analytics_overview(
    period: str = "30d",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get KPI overview for the workspace."""
    workspace = _get_workspace(db, current_user)
    days = _parse_period(period)
    start_date = datetime.now(timezone.utc) - timedelta(days=days)

    # Total bookings in period
    total_bookings = db.query(func.count(Booking.id)).filter(
        Booking.workspace_id == workspace.id,
        Booking.created_at >= start_date,
    ).scalar() or 0

    # Completed bookings
    completed_bookings = db.query(func.count(Booking.id)).filter(
        Booking.workspace_id == workspace.id,
        Booking.created_at >= start_date,
        Booking.status == BookingStatus.COMPLETED,
    ).scalar() or 0

    # Booking conversion rate
    conversion_rate = (completed_bookings / total_bookings * 100) if total_bookings > 0 else 0.0

    # Total contacts
    total_contacts = db.query(func.count(Contact.id)).filter(
        Contact.workspace_id == workspace.id,
        Contact.created_at >= start_date,
    ).scalar() or 0

    # Form completion rate
    total_forms = db.query(func.count(BookingForm.id)).join(Booking).filter(
        Booking.workspace_id == workspace.id,
        BookingForm.created_at >= start_date,
    ).scalar() or 0

    completed_forms = db.query(func.count(BookingForm.id)).join(Booking).filter(
        Booking.workspace_id == workspace.id,
        BookingForm.created_at >= start_date,
        BookingForm.status == FormStatus.COMPLETED,
    ).scalar() or 0

    form_rate = (completed_forms / total_forms * 100) if total_forms > 0 else 0.0

    # Inventory health score
    total_items = db.query(func.count(InventoryItem.id)).filter(
        InventoryItem.workspace_id == workspace.id,
    ).scalar() or 0

    healthy_items = db.query(func.count(InventoryItem.id)).filter(
        InventoryItem.workspace_id == workspace.id,
        InventoryItem.total_quantity > InventoryItem.min_threshold,
    ).scalar() or 0

    inventory_health = (healthy_items / total_items * 100) if total_items > 0 else 100.0

    return KPIOverview(
        total_bookings=total_bookings,
        total_contacts=total_contacts,
        booking_conversion_rate=round(conversion_rate, 1),
        form_completion_rate=round(form_rate, 1),
        avg_response_time_minutes=0.0,  # Would need message timestamp analysis
        inventory_health_score=round(inventory_health, 1),
        revenue_estimate=0.0,  # Would need pricing data integration
        period=period,
    )


@router.get("/trends", response_model=TrendsResponse)
def get_analytics_trends(
    period: str = "30d",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get time-series trend data."""
    workspace = _get_workspace(db, current_user)
    days = _parse_period(period)
    start_date = datetime.now(timezone.utc) - timedelta(days=days)

    # Get bookings grouped by date
    bookings = db.query(Booking).filter(
        Booking.workspace_id == workspace.id,
        Booking.created_at >= start_date,
    ).all()

    contacts = db.query(Contact).filter(
        Contact.workspace_id == workspace.id,
        Contact.created_at >= start_date,
    ).all()

    # Group by date
    booking_counts = defaultdict(int)
    contact_counts = defaultdict(int)

    for b in bookings:
        key = b.created_at.strftime("%Y-%m-%d")
        booking_counts[key] += 1

    for c in contacts:
        key = c.created_at.strftime("%Y-%m-%d")
        contact_counts[key] += 1

    # Build data points for each day
    data = []
    for i in range(days):
        date = (datetime.now(timezone.utc) - timedelta(days=days - 1 - i)).strftime("%Y-%m-%d")
        data.append(TrendDataPoint(
            date=date,
            bookings=booking_counts.get(date, 0),
            contacts=contact_counts.get(date, 0),
            forms_completed=0,
            revenue=0.0,
        ))

    return TrendsResponse(
        data=data,
        period=period,
        total_data_points=len(data),
    )


@router.get("/ai-insights", response_model=AIInsightsResponse)
async def get_ai_insights(
    period: str = "30d",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get AI-generated business insights."""
    workspace = _get_workspace(db, current_user)
    days = _parse_period(period)
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    prev_start = start_date - timedelta(days=days)

    # Current period metrics
    curr_bookings = db.query(func.count(Booking.id)).filter(
        Booking.workspace_id == workspace.id,
        Booking.created_at >= start_date,
    ).scalar() or 0

    curr_contacts = db.query(func.count(Contact.id)).filter(
        Contact.workspace_id == workspace.id,
        Contact.created_at >= start_date,
    ).scalar() or 0

    # Previous period metrics
    prev_bookings = db.query(func.count(Booking.id)).filter(
        Booking.workspace_id == workspace.id,
        Booking.created_at >= prev_start,
        Booking.created_at < start_date,
    ).scalar() or 0

    prev_contacts = db.query(func.count(Contact.id)).filter(
        Contact.workspace_id == workspace.id,
        Contact.created_at >= prev_start,
        Contact.created_at < start_date,
    ).scalar() or 0

    # Calculate changes
    booking_change = ((curr_bookings - prev_bookings) / prev_bookings * 100) if prev_bookings > 0 else 0.0
    contact_change = ((curr_contacts - prev_contacts) / prev_contacts * 100) if prev_contacts > 0 else 0.0

    # Low stock items
    low_stock = db.query(func.count(InventoryItem.id)).filter(
        InventoryItem.workspace_id == workspace.id,
        InventoryItem.total_quantity <= InventoryItem.min_threshold,
    ).scalar() or 0

    # Try AI-generated insights
    if ai_service.available:
        try:
            import json
            metrics = {
                "period": period,
                "current_bookings": curr_bookings,
                "previous_bookings": prev_bookings,
                "booking_change_percent": round(booking_change, 1),
                "current_contacts": curr_contacts,
                "previous_contacts": prev_contacts,
                "contact_change_percent": round(contact_change, 1),
                "low_stock_items": low_stock,
            }

            prompt = f"""Analyze these business metrics and provide insights as JSON:
{json.dumps(metrics)}

Return ONLY valid JSON:
{{
  "summary": "2-3 sentence executive summary",
  "highlights": [{{"type":"highlight","title":"short title","description":"detail","change_percent":0.0}}],
  "recommendations": [{{"type":"recommendation","title":"short title","description":"detail"}}],
  "risk_areas": [{{"type":"risk","title":"short title","description":"detail"}}]
}}"""

            response = ai_service.groq_client.chat.completions.create(
                model=ai_service.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=600,
                response_format={"type": "json_object"},
            )

            result = json.loads(response.choices[0].message.content)

            return AIInsightsResponse(
                summary=result.get("summary", ""),
                highlights=[AIInsight(**h) for h in result.get("highlights", [])],
                recommendations=[AIInsight(**r) for r in result.get("recommendations", [])],
                risk_areas=[AIInsight(**r) for r in result.get("risk_areas", [])],
                method="ai",
                period=period,
            )
        except Exception:
            pass  # Fall through to rule-based

    # Rule-based fallback insights
    highlights = []
    recommendations = []
    risk_areas = []

    if booking_change > 5:
        highlights.append(AIInsight(
            type="highlight", title="Bookings Growing",
            description=f"Bookings increased by {booking_change:.1f}% compared to the previous period.",
            change_percent=round(booking_change, 1),
        ))
    elif booking_change < -5:
        risk_areas.append(AIInsight(
            type="risk", title="Bookings Declining",
            description=f"Bookings decreased by {abs(booking_change):.1f}%. Consider running promotions.",
            change_percent=round(booking_change, 1),
        ))

    if contact_change > 10:
        highlights.append(AIInsight(
            type="highlight", title="New Leads Growing",
            description=f"New contacts increased by {contact_change:.1f}%.",
            change_percent=round(contact_change, 1),
        ))

    if low_stock > 0:
        risk_areas.append(AIInsight(
            type="risk", title="Low Inventory Alert",
            description=f"{low_stock} item(s) are below the minimum stock threshold.",
        ))

    recommendations.append(AIInsight(
        type="recommendation", title="Review Trends Regularly",
        description="Check analytics weekly to catch trends early.",
    ))

    summary = f"Over the past {period}, you had {curr_bookings} bookings and {curr_contacts} new contacts."
    if booking_change != 0:
        direction = "up" if booking_change > 0 else "down"
        summary += f" Bookings are {direction} {abs(booking_change):.1f}% from the previous period."

    return AIInsightsResponse(
        summary=summary,
        highlights=highlights,
        recommendations=recommendations,
        risk_areas=risk_areas,
        method="rule-based",
        period=period,
    )

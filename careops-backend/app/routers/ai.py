"""
AI Router - Exposes AI endpoints for customer inquiry processing, demand forecasting, staff routing
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field
from datetime import datetime, timedelta, timezone

from app.database import get_db
from app.models.workspace import Workspace
from app.models.user import User, StaffPermission
from app.models.booking import Booking
from app.models.contact import Contact
from app.core.dependencies import get_current_user
from app.services.ai_service import (
    ai_service,
    InquiryContext,
    InquiryResult,
    DemandForecastInput,
    DemandForecastResult,
    StaffRoutingInput,
    StaffRoutingResult,
)

router = APIRouter(prefix="/api/v1/ai", tags=["AI"])


def get_workspace(db: Session, current_user: User) -> Workspace:
    """Get the current user's workspace (supports both owner and staff)."""
    workspace = db.query(Workspace).filter(Workspace.owner_id == current_user.id).first()
    if not workspace and current_user.workspace_id:
        workspace = db.query(Workspace).filter(Workspace.id == current_user.workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace


# ============ Request/Response Schemas ============

class ProcessInquiryRequest(BaseModel):
    """Request to process customer inquiry"""
    conversation_id: UUID
    message: str = Field(..., min_length=1)


class ProcessInquiryResponse(BaseModel):
    """Response from inquiry processing"""
    intent: str
    sentiment: str
    confidence: float
    suggested_response: Optional[str]
    method: str
    fallback_used: bool
    explanation: Optional[str]


class DemandForecastRequest(BaseModel):
    """Request for demand forecasting"""
    days_to_forecast: int = Field(default=7, ge=1, le=30)


class DemandForecastItem(BaseModel):
    """Single forecast entry"""
    date: str
    predicted_count: int
    confidence: float


class DemandForecastResponse(BaseModel):
    """Response with demand forecast"""
    forecast: List[DemandForecastItem]
    method: str
    confidence: float
    fallback_used: bool


class StaffRoutingRequest(BaseModel):
    """Request for staff routing"""
    inquiry_intent: str
    inquiry_subject: str
    required_skills: List[str] = []


class StaffRoutingResponse(BaseModel):
    """Response with routing decision"""
    recommended_staff_id: Optional[str]
    reasoning: str
    confidence: float
    fallback_used: bool
    method: str


class AIHealthResponse(BaseModel):
    """AI service health status"""
    available: bool
    model: Optional[str]
    confidence_threshold: float


# ============ AI Endpoints ============

@router.get("/health", response_model=AIHealthResponse)
def ai_health_check():
    """Check AI service availability"""
    return AIHealthResponse(
        available=ai_service.available,
        model=ai_service.model if ai_service.available else None,
        confidence_threshold=0.75,
    )


@router.post("/process-inquiry", response_model=ProcessInquiryResponse)
async def process_customer_inquiry(
    request: ProcessInquiryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Process customer inquiry with AI to detect intent and sentiment"""
    
    workspace = get_workspace(db, current_user)

    # Get conversation context
    from app.models.conversation import Conversation, Message
    conversation = db.query(Conversation).filter(
        Conversation.id == request.conversation_id,
        Conversation.workspace_id == workspace.id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Build context — fetch only last 5 messages via query (avoid lazy-loading all messages)
    recent_messages = db.query(Message).filter(
        Message.conversation_id == conversation.id
    ).order_by(Message.created_at.desc()).limit(5).all()
    
    context = InquiryContext(
        contact_name=conversation.contact.name if conversation.contact else None,
        contact_email=conversation.contact.email if conversation.contact else None,
        previous_conversation=[
            m.content for m in reversed(recent_messages)
        ] if recent_messages else None,
        workspace_services=None,  # Could fetch from booking_types
        booking_history=0,
    )
    
    # Process inquiry
    result = await ai_service.process_inquiry(request.message, context)
    
    return ProcessInquiryResponse(
        intent=result.intent,
        sentiment=result.sentiment,
        confidence=result.confidence,
        suggested_response=result.suggested_response,
        method=result.method,
        fallback_used=result.fallback_used,
        explanation=result.explanation,
    )


@router.post("/demand-forecast", response_model=DemandForecastResponse)
async def get_demand_forecast(
    request: DemandForecastRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get demand forecast based on historical booking data"""
    
    workspace = get_workspace(db, current_user)

    # Get historical booking data (last 30 days)
    start_date = datetime.now(timezone.utc) - timedelta(days=30)
    bookings = db.query(Booking).filter(
        Booking.workspace_id == workspace.id,
        Booking.created_at >= start_date,
    ).all()
    
    # Group by date
    from collections import defaultdict
    daily_counts = defaultdict(int)
    for booking in bookings:
        date_key = booking.created_at.strftime("%Y-%m-%d")
        daily_counts[date_key] += 1
    
    # Convert to list format
    historical_data = [
        {"date": date, "count": count}
        for date, count in sorted(daily_counts.items())
    ]
    
    # Get forecast
    input_data = DemandForecastInput(
        historical_data=historical_data,
        days_to_forecast=request.days_to_forecast,
    )
    
    result = await ai_service.predict_demand(input_data)
    
    return DemandForecastResponse(
        forecast=[
            DemandForecastItem(
                date=f["date"],
                predicted_count=f.get("predicted_count", 0),
                confidence=f.get("confidence", 0.75),
            )
            for f in result.forecast
        ],
        method=result.method,
        confidence=result.confidence,
        fallback_used=result.fallback_used,
    )


@router.post("/route-staff", response_model=StaffRoutingResponse)
async def route_to_staff(
    request: StaffRoutingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Route inquiry to appropriate staff member based on skills"""
    
    workspace = get_workspace(db, current_user)

    # Get staff members for workspace (excluding owner)
    staff_members = []
    users = db.query(User).filter(
        User.workspace_id == workspace.id,
        User.role == "staff",
    ).all()
    
    for user in users:
        # Get permissions
        permissions = db.query(StaffPermission).filter(
            StaffPermission.user_id == user.id
        ).first()
        
        # Build skills from permissions
        skills = []
        if permissions:
            if permissions.can_inbox:
                skills.append("inbox")
            if permissions.can_bookings:
                skills.append("bookings")
            if permissions.can_forms:
                skills.append("forms")
            if permissions.can_inventory:
                skills.append("inventory")
        
        staff_members.append({
            "id": str(user.id),
            "name": user.email.split("@")[0],
            "skills": skills,
            "available": True,  # Could check last_login
        })
    
    # Route to staff
    input_data = StaffRoutingInput(
        inquiry_intent=request.inquiry_intent,
        inquiry_subject=request.inquiry_subject,
        required_skills=request.required_skills,
        staff_members=staff_members,
    )
    
    result = await ai_service.route_to_staff(input_data)
    
    return StaffRoutingResponse(
        recommended_staff_id=result.recommended_staff_id,
        reasoning=result.reasoning,
        confidence=result.confidence,
        fallback_used=result.fallback_used,
        method=result.method,
    )


@router.get("/inventory-optimization")
async def get_inventory_optimization(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get AI-powered inventory optimization recommendations"""
    
    workspace = get_workspace(db, current_user)

    # Get inventory items
    from app.models.inventory import InventoryItem
    items = db.query(InventoryItem).filter(
        InventoryItem.workspace_id == workspace.id,
    ).all()
    
    # Simple optimization recommendations
    recommendations = []
    for item in items:
        if item.min_threshold is not None and item.total_quantity <= item.min_threshold:
            recommendations.append({
                "item_id": str(item.id),
                "item_name": item.name,
                "current_quantity": float(item.total_quantity),
                "threshold": float(item.min_threshold),
                "recommendation": "restock",
                "suggested_quantity": float(item.min_threshold) * 2,
                "urgency": "high" if float(item.total_quantity) < float(item.min_threshold) * 0.5 else "medium",
            })
    
    return {
        "recommendations": recommendations,
        "method": "rule-based" if not ai_service.available else "ai-assisted",
        "total_items": len(items),
        "items_needing_attention": len(recommendations),
    }


# ============ New AI Endpoints (Phase 10) ============

class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1)
    target_language: str = Field(..., min_length=2, max_length=10)
    source_language: str = Field(default="auto")


class DetectLanguageRequest(BaseModel):
    text: str = Field(..., min_length=1)


class SegmentContactsRequest(BaseModel):
    contact_ids: Optional[List[UUID]] = None  # None = all contacts


class MaintenancePredictionRequest(BaseModel):
    equipment_ids: Optional[List[UUID]] = None  # None = all equipment


@router.post("/translate")
async def translate_text(
    request: TranslateRequest,
    current_user: User = Depends(get_current_user),
):
    """Translate text to target language using AI."""
    result = await ai_service.translate_text(
        text=request.text,
        target_language=request.target_language,
        source_language=request.source_language,
    )
    return result


@router.post("/detect-language")
async def detect_language(
    request: DetectLanguageRequest,
    current_user: User = Depends(get_current_user),
):
    """Detect the language of a text using AI."""
    result = await ai_service.detect_language(request.text)
    return result


@router.post("/segment-contacts")
async def segment_contacts(
    request: SegmentContactsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """AI-powered contact segmentation."""
    workspace = get_workspace(db, current_user)

    query = db.query(Contact).filter(Contact.workspace_id == workspace.id)
    if request.contact_ids:
        query = query.filter(Contact.id.in_(request.contact_ids))

    contacts = query.limit(100).all()
    results = []

    for contact in contacts:
        activity_data = {
            "total_bookings": contact.total_bookings or 0,
            "lifetime_value": contact.lifetime_value or 0,
            "last_activity": str(contact.last_activity_at) if contact.last_activity_at else "never",
            "created_at": str(contact.created_at),
        }
        segment_result = await ai_service.segment_contact(activity_data)

        # Update contact segment in DB
        contact.segment = segment_result.get("segment", "regular")
        results.append({
            "contact_id": str(contact.id),
            "name": contact.name,
            **segment_result,
        })

    db.commit()
    return {"segmented": len(results), "results": results}


@router.post("/maintenance-predictions")
async def maintenance_predictions(
    request: MaintenancePredictionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """AI-powered maintenance predictions for equipment."""
    workspace = get_workspace(db, current_user)

    from app.models.equipment import Equipment
    query = db.query(Equipment).filter(Equipment.workspace_id == workspace.id)
    if request.equipment_ids:
        query = query.filter(Equipment.id.in_(request.equipment_ids))

    equipment_list = query.all()
    results = []

    for eq in equipment_list:
        eq_data = {
            "name": eq.name,
            "type": eq.type or "general",
            "last_maintained": str(eq.last_maintained_at) if eq.last_maintained_at else None,
            "interval_days": eq.maintenance_interval_days,
            "usage_count": eq.usage_count or 0,
            "status": eq.status.value if eq.status else "active",
            "age_days": (datetime.now(timezone.utc) - eq.purchase_date).days if eq.purchase_date else 0,
        }
        prediction = await ai_service.predict_maintenance(eq_data)
        results.append({
            "equipment_id": str(eq.id),
            "equipment_name": eq.name,
            **prediction,
        })

    return {"total": len(results), "predictions": results}

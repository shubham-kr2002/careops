"""
AI Router - Exposes AI endpoints for customer inquiry processing, demand forecasting, staff routing
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field
from datetime import datetime, timedelta

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
    
    # Get workspace
    workspace = db.query(Workspace).filter(
        Workspace.owner_id == current_user.id
    ).first()
    
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    # Get conversation context
    from app.models.conversation import Conversation, Message
    conversation = db.query(Conversation).filter(
        Conversation.id == request.conversation_id,
        Conversation.workspace_id == workspace.id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Build context
    context = InquiryContext(
        contact_name=conversation.contact.name if conversation.contact else None,
        contact_email=conversation.contact.email if conversation.contact else None,
        previous_conversation=[
            m.content for m in conversation.messages[-5:]
        ] if conversation.messages else None,
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
    
    # Get workspace
    workspace = db.query(Workspace).filter(
        Workspace.owner_id == current_user.id
    ).first()
    
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    # Get historical booking data (last 30 days)
    start_date = datetime.utcnow() - timedelta(days=30)
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
    
    # Get workspace
    workspace = db.query(Workspace).filter(
        Workspace.owner_id == current_user.id
    ).first()
    
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
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
    
    # Get workspace
    workspace = db.query(Workspace).filter(
        Workspace.owner_id == current_user.id
    ).first()
    
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    # Get inventory items
    from app.models.inventory import InventoryItem
    items = db.query(InventoryItem).filter(
        InventoryItem.workspace_id == workspace.id,
    ).all()
    
    # Simple optimization recommendations
    recommendations = []
    for item in items:
        if item.quantity <= item.threshold:
            recommendations.append({
                "item_id": str(item.id),
                "item_name": item.name,
                "current_quantity": item.quantity,
                "threshold": item.threshold,
                "recommendation": "restock",
                "suggested_quantity": item.threshold * 2,
                "urgency": "high" if item.quantity < item.threshold * 0.5 else "medium",
            })
    
    return {
        "recommendations": recommendations,
        "method": "rule-based" if not ai_service.available else "ai-assisted",
        "total_items": len(items),
        "items_needing_attention": len(recommendations),
    }

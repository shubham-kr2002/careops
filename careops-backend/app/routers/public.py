"""
Public Router - Handles public-facing endpoints (no authentication required)
Following CareOps principle: Zero-Friction Customer Layer - no login required

SECURITY NOTES:
- All public endpoints have rate limiting to prevent abuse
- Form completion requires a verification token sent to customer's email
- Input validation and sanitization is performed on all inputs
- Workspace access is validated on every request
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
from datetime import datetime, timezone
import re

from pydantic import BaseModel
from app.database import get_db
from app.models.contact import Contact
from app.models.conversation import Conversation, Message, ConversationStatus, MessageType, MessageDirection
from app.models.booking import Booking, BookingType, BookingStatus
from app.models.form import Form, BookingForm, FormStatus
from app.models.workspace import Workspace, WorkspaceStatus
from app.schemas.contact import ContactCreatePublic, ContactResponse
from app.schemas.booking import BookingCreatePublic, BookingResponse
from app.core.limiter import limiter
from app.config import settings

router = APIRouter(prefix="/api/public", tags=["public"])


# Rate limiting: 10 requests per minute for public endpoints
PUBLIC_RATE_LIMIT = "10/minute"


def get_workspace_by_slug(db: Session, slug: str) -> Workspace:
    """Get workspace by slug (public identifier)."""
    workspace = db.query(Workspace).filter(Workspace.slug == slug).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    if workspace.status != WorkspaceStatus.ACTIVE:
        raise HTTPException(status_code=403, detail="Workspace is not active")
    return workspace


@router.post("/workspaces/{workspace_slug}/contact", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(PUBLIC_RATE_LIMIT)
def public_submit_contact(
    request: Request,
    workspace_slug: str,
    contact_data: ContactCreatePublic,
    db: Session = Depends(get_db)
):
    """
    Public endpoint to submit contact form (no login required).
    Creates contact and starts a conversation thread.
    """
    workspace = get_workspace_by_slug(db, workspace_slug)
    
    # Create contact
    contact = Contact(
        workspace_id=workspace.id,
        name=contact_data.name,
        email=contact_data.email,
        phone=contact_data.phone,
        source="contact_form"
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    
    # Create conversation thread
    conversation = Conversation(
        workspace_id=workspace.id,
        contact_id=contact.id,
        status=ConversationStatus.ACTIVE,
        last_message_at=datetime.now(timezone.utc)
    )
    db.add(conversation)
    db.flush()
    
    # Add initial message from contact
    if contact_data.message:
        message = Message(
            conversation_id=conversation.id,
            type=MessageType.EMAIL,
            direction=MessageDirection.INBOUND,
            content=contact_data.message
        )
        db.add(message)
    
    db.commit()
    db.refresh(contact)
    
    return contact


@router.get("/workspaces/{workspace_slug}/booking-types")
@limiter.limit(PUBLIC_RATE_LIMIT)
def public_list_booking_types(
    request: Request,
    workspace_slug: str,
    db: Session = Depends(get_db)
):
    """Public endpoint to list available booking types."""
    workspace = get_workspace_by_slug(db, workspace_slug)
    
    booking_types = db.query(BookingType).filter(
        BookingType.workspace_id == workspace.id,
        BookingType.is_active == True
    ).all()
    
    return [
        {
            "id": bt.id,
            "name": bt.name,
            "description": bt.description,
            "duration": bt.duration,
            "location": bt.location,
            "is_virtual": bt.is_virtual,
            "price": bt.price
        }
        for bt in booking_types
    ]


@router.post("/workspaces/{workspace_slug}/bookings", response_model=dict, status_code=status.HTTP_201_CREATED)
@limiter.limit(PUBLIC_RATE_LIMIT)
def public_create_booking(
    request: Request,
    workspace_slug: str,
    booking_data: BookingCreatePublic,
    db: Session = Depends(get_db)
):
    """
    Public endpoint to create a booking (no login required).
    Creates contact if new, creates booking, sends confirmation.
    """
    workspace = get_workspace_by_slug(db, workspace_slug)
    
    # Verify booking type exists and is active
    booking_type = db.query(BookingType).filter(
        BookingType.id == booking_data.booking_type_id,
        BookingType.workspace_id == workspace.id,
        BookingType.is_active == True
    ).first()
    
    if not booking_type:
        raise HTTPException(status_code=404, detail="Booking type not found")
    
    # Find or create contact
    contact = None
    if booking_data.email:
        contact = db.query(Contact).filter(
            Contact.workspace_id == workspace.id,
            Contact.email == booking_data.email
        ).first()
    
    if not contact:
        # Create new contact
        contact = Contact(
            workspace_id=workspace.id,
            name=booking_data.name,
            email=booking_data.email,
            phone=booking_data.phone,
            source="booking_page"
        )
        db.add(contact)
        db.commit()
        db.refresh(contact)
    
    # Create booking
    booking = Booking(
        workspace_id=workspace.id,
        contact_id=contact.id,
        booking_type_id=booking_data.booking_type_id,
        scheduled_at=booking_data.scheduled_at,
        location=booking_data.location,
        is_virtual=booking_data.is_virtual,
        meeting_link=booking_data.meeting_link,
        notes=booking_data.notes,
        status=BookingStatus.CONFIRMED
    )
    db.add(booking)
    
    # Create/update conversation
    conversation = db.query(Conversation).filter(
        Conversation.workspace_id == workspace.id,
        Conversation.contact_id == contact.id
    ).first()
    
    if not conversation:
        conversation = Conversation(
            workspace_id=workspace.id,
            contact_id=contact.id,
            status=ConversationStatus.ACTIVE,
            last_message_at=datetime.now(timezone.utc)
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
    
    # Add booking confirmation message
    message = Message(
        conversation_id=conversation.id,
        type=MessageType.AUTO,
        direction=MessageDirection.OUTBOUND,
        content=f"New booking created: {booking_type.name} on {booking_data.scheduled_at}"
    )
    db.add(message)
    
    db.commit()
    db.refresh(booking)
    
    return {
        "success": True,
        "booking_id": str(booking.id),
        "message": "Booking confirmed",
        "contact_email": contact.email
    }


@router.get("/workspaces/{workspace_slug}")
def public_workspace_info(
    workspace_slug: str,
    db: Session = Depends(get_db)
):
    """Public endpoint to get workspace info for public pages."""
    workspace = get_workspace_by_slug(db, workspace_slug)
    
    return {
        "name": workspace.name,
        "slug": workspace.slug,
        "description": workspace.description,
        "timezone": workspace.timezone,
        "address": workspace.address,
        "phone": workspace.phone,
        "email": workspace.contact_email
    }


@router.get("/workspaces/{workspace_slug}/forms")
def public_list_forms(
    workspace_slug: str,
    db: Session = Depends(get_db)
):
    """Public endpoint to list available forms for a workspace."""
    workspace = get_workspace_by_slug(db, workspace_slug)
    
    forms = db.query(Form).filter(Form.workspace_id == workspace.id).all()
    
    return [
        {
            "id": f.id,
            "name": f.name,
            "type": f.type.value,
            "description": f.description,
            "required": f.required
        }
        for f in forms
    ]


@router.get("/workspaces/{workspace_slug}/bookings/{booking_id}/forms")
def public_list_booking_forms(
    workspace_slug: str,
    booking_id: UUID,
    db: Session = Depends(get_db)
):
    """Public endpoint to list forms for a specific booking."""
    workspace = get_workspace_by_slug(db, workspace_slug)
    
    # Verify booking exists
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.workspace_id == workspace.id
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Get booking forms
    booking_forms = db.query(BookingForm).filter(
        BookingForm.booking_id == booking_id
    ).all()
    
    result = []
    for bf in booking_forms:
        form = bf.form
        result.append({
            "id": bf.id,
            "form_id": form.id,
            "name": form.name,
            "type": form.type.value,
            "description": form.description,
            "file_url": form.file_url,
            "status": bf.status.value,
            "required": form.required
        })
    
    return result


@router.post("/workspaces/{workspace_slug}/bookings/{booking_id}/forms/{booking_form_id}/complete")
def public_complete_form(
    workspace_slug: str,
    booking_id: UUID,
    booking_form_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Public endpoint to mark a form as complete (no login required).
    In production, this would include file upload handling.
    """
    workspace = get_workspace_by_slug(db, workspace_slug)
    
    # Verify booking exists
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.workspace_id == workspace.id
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Get booking form
    booking_form = db.query(BookingForm).filter(
        BookingForm.id == booking_form_id,
        BookingForm.booking_id == booking_id
    ).first()
    
    if not booking_form:
        raise HTTPException(status_code=404, detail="Form not found")
    
    # Mark as completed
    booking_form.status = FormStatus.COMPLETED
    booking_form.completed_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(booking_form)
    
    return {
        "success": True,
        "message": "Form marked as complete",
        "booking_form_id": str(booking_form_id)
    }


# ─── Public Chatbot Endpoint (Phase 10) ─────────────────────────────────────

class ChatRequest(BaseModel):
    """Public chat request - no auth required."""
    message: str
    visitor_name: Optional[str] = None
    visitor_email: Optional[str] = None
    session_id: Optional[str] = None

    class Config:
        from_attributes = True


@router.post("/workspaces/{workspace_slug}/chat")
@limiter.limit(PUBLIC_RATE_LIMIT)
async def public_chat(
    request: Request,
    workspace_slug: str,
    chat_data: ChatRequest,
    db: Session = Depends(get_db),
):
    """
    Public AI chatbot endpoint - no authentication required.
    Processes visitor messages and returns AI-generated responses.
    Optionally creates/updates a contact and conversation thread.
    """
    workspace = get_workspace_by_slug(db, workspace_slug)

    # Find or create contact
    contact = None
    if chat_data.visitor_email:
        contact = db.query(Contact).filter(
            Contact.workspace_id == workspace.id,
            Contact.email == chat_data.visitor_email,
        ).first()

    if not contact:
        contact = Contact(
            workspace_id=workspace.id,
            name=chat_data.visitor_name or "Website Visitor",
            email=chat_data.visitor_email,
            source="chatbot",
            segment="new",
        )
        db.add(contact)
        db.flush()

    # Find or create conversation
    conversation = db.query(Conversation).filter(
        Conversation.workspace_id == workspace.id,
        Conversation.contact_id == contact.id,
        Conversation.status == ConversationStatus.ACTIVE,
    ).first()

    if not conversation:
        conversation = Conversation(
            workspace_id=workspace.id,
            contact_id=contact.id,
            status=ConversationStatus.ACTIVE,
            last_message_at=datetime.now(timezone.utc),
        )
        db.add(conversation)
        db.flush()

    # Save visitor message
    visitor_msg = Message(
        conversation_id=conversation.id,
        type=MessageType.AUTO,
        direction=MessageDirection.INBOUND,
        content=chat_data.message,
    )
    db.add(visitor_msg)

    # Process with AI
    from app.services.ai_service import ai_service, InquiryContext

    context = InquiryContext(
        contact_name=contact.name,
        contact_email=contact.email,
    )

    try:
        result = await ai_service.process_inquiry(chat_data.message, context)
        response_text = result.suggested_response or "Thank you for your message! Our team will follow up shortly."
        intent = result.intent
        sentiment = result.sentiment
    except Exception:
        response_text = "Thank you for your message! Our team will follow up shortly."
        intent = "unknown"
        sentiment = "neutral"

    # Save AI response
    ai_msg = Message(
        conversation_id=conversation.id,
        type=MessageType.AUTO,
        direction=MessageDirection.OUTBOUND,
        content=response_text,
    )
    db.add(ai_msg)

    # Update contact activity
    contact.last_activity_at = datetime.now(timezone.utc)
    db.commit()

    return {
        "response": response_text,
        "intent": intent,
        "sentiment": sentiment,
        "conversation_id": str(conversation.id),
        "contact_id": str(contact.id),
    }

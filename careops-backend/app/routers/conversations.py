"""
Conversation Router - Handles conversations and messages
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from pydantic import BaseModel, Field

from app.database import get_db
from app.models.conversation import Conversation, Message, ConversationStatus, MessageType, MessageDirection
from app.models.workspace import Workspace
from app.models.user import User
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/conversations", tags=["conversations"])


def get_workspace(db: Session, current_user: User):
    """Get the current user's workspace."""
    workspace = db.query(Workspace).filter(Workspace.owner_id == current_user.id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace


class MessageCreate(BaseModel):
    """Schema for creating a message."""
    content: str = Field(..., min_length=1)


class MessageResponse(BaseModel):
    """Schema for message response."""
    id: UUID
    conversation_id: UUID
    type: str
    direction: str
    content: str
    provider_message_id: str | None = None
    created_at: str

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    """Schema for conversation response."""
    id: UUID
    contact_id: UUID
    workspace_id: UUID
    status: str
    automation_paused: str | None = None
    last_message_at: str | None = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class ConversationListResponse(BaseModel):
    """Schema for conversation list with contact info."""
    id: UUID
    contact_name: str
    contact_email: str | None = None
    contact_phone: str | None = None
    status: str
    automation_paused: str | None = None
    last_message: str | None = None
    last_message_at: str | None = None
    unread_count: int = 0
    created_at: str


@router.get("", response_model=List[ConversationListResponse])
def list_conversations(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all conversations for the workspace."""
    workspace = get_workspace(db, current_user)
    conversations = db.query(Conversation).filter(
        Conversation.workspace_id == workspace.id
    ).order_by(Conversation.last_message_at.desc().nullslast()).offset(skip).limit(limit).all()
    
    result = []
    for conv in conversations:
        last_msg = conv.messages[-1] if conv.messages else None
        unread_count = sum(1 for m in conv.messages if m.direction == MessageDirection.INBOUND and not hasattr(m, 'read'))
        
        result.append(ConversationListResponse(
            id=conv.id,
            contact_name=conv.contact.name if conv.contact else "Unknown",
            contact_email=conv.contact.email if conv.contact else None,
            contact_phone=conv.contact.phone if conv.contact else None,
            status=conv.status.value,
            automation_paused=conv.automation_paused,
            last_message=last_msg.content if last_msg else None,
            last_message_at=conv.last_message_at.isoformat() if conv.last_message_at else None,
            unread_count=unread_count,
            created_at=conv.created_at.isoformat()
        ))
    
    return result


@router.get("/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific conversation."""
    workspace = get_workspace(db, current_user)
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.workspace_id == workspace.id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return ConversationResponse(
        id=conversation.id,
        contact_id=conversation.contact_id,
        workspace_id=conversation.workspace_id,
        status=conversation.status.value,
        automation_paused=conversation.automation_paused,
        last_message_at=conversation.last_message_at.isoformat() if conversation.last_message_at else None,
        created_at=conversation.created_at.isoformat(),
        updated_at=conversation.updated_at.isoformat()
    )


@router.get("/{conversation_id}/messages", response_model=List[MessageResponse])
def get_conversation_messages(
    conversation_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all messages in a conversation."""
    workspace = get_workspace(db, current_user)
    
    # Verify conversation belongs to workspace
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.workspace_id == workspace.id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at.asc()).offset(skip).limit(limit).all()
    
    return [
        MessageResponse(
            id=msg.id,
            conversation_id=msg.conversation_id,
            type=msg.type.value,
            direction=msg.direction.value,
            content=msg.content,
            provider_message_id=msg.provider_message_id,
            created_at=msg.created_at.isoformat()
        )
        for msg in messages
    ]


@router.post("/{conversation_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def create_message(
    conversation_id: UUID,
    message_data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new message in a conversation."""
    workspace = get_workspace(db, current_user)
    
    # Verify conversation belongs to workspace
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.workspace_id == workspace.id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Create the message
    message = Message(
        conversation_id=conversation_id,
        type=MessageType.SMS,  # Default to SMS for staff messages
        direction=MessageDirection.OUTBOUND,
        content=message_data.content,
        created_by_id=current_user.id
    )
    db.add(message)
    
    # Update conversation last_message_at
    conversation.last_message_at = message.created_at
    
    # PAUSE AUTOMATION when staff replies (Rule #4: If a human staff member replies, the automation loop MUST pause immediately)
    conversation.automation_paused = "staff_reply"
    
    db.commit()
    db.refresh(message)
    
    return MessageResponse(
        id=message.id,
        conversation_id=message.conversation_id,
        type=message.type.value,
        direction=message.direction.value,
        content=message.content,
        provider_message_id=message.provider_message_id,
        created_at=message.created_at.isoformat()
    )


@router.post("/{conversation_id}/pause-automation", response_model=ConversationResponse)
def pause_conversation_automation(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Pause automation for a conversation."""
    workspace = get_workspace(db, current_user)
    
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.workspace_id == workspace.id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    conversation.automation_paused = "manual_pause"
    db.commit()
    db.refresh(conversation)
    
    return ConversationResponse(
        id=conversation.id,
        contact_id=conversation.contact_id,
        workspace_id=conversation.workspace_id,
        status=conversation.status.value,
        automation_paused=conversation.automation_paused,
        last_message_at=conversation.last_message_at.isoformat() if conversation.last_message_at else None,
        created_at=conversation.created_at.isoformat(),
        updated_at=conversation.updated_at.isoformat()
    )


@router.post("/{conversation_id}/resume-automation", response_model=ConversationResponse)
def resume_conversation_automation(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Resume automation for a conversation."""
    workspace = get_workspace(db, current_user)
    
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.workspace_id == workspace.id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    conversation.automation_paused = None
    db.commit()
    db.refresh(conversation)
    
    return ConversationResponse(
        id=conversation.id,
        contact_id=conversation.contact_id,
        workspace_id=conversation.workspace_id,
        status=conversation.status.value,
        automation_paused=conversation.automation_paused,
        last_message_at=conversation.last_message_at.isoformat() if conversation.last_message_at else None,
        created_at=conversation.created_at.isoformat(),
        updated_at=conversation.updated_at.isoformat()
    )


@router.post("/sync-email", response_model=dict)
def sync_email_messages(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Sync email messages from email provider."""
    # Placeholder for email integration
    # Would integrate with email provider (SendGrid, Mailgun, etc.)
    return {"status": "sync_initiated", "provider": "email"}


@router.post("/sync-sms", response_model=dict)
def sync_sms_messages(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Sync SMS messages from SMS provider."""
    # Placeholder for SMS integration
    # Would integrate with SMS provider (Twilio, etc.)
    return {"status": "sync_initiated", "provider": "sms"}

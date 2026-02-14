import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Index, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class ConversationStatus(str, enum.Enum):
    """Conversation status enumeration."""
    ACTIVE = "active"
    ARCHIVED = "archived"
    PAUSED = "paused"


class Conversation(Base):
    """Conversation model - unified thread for all communication."""
    __tablename__ = "conversations"
    
    __table_args__ = (
        Index('ix_conversations_workspace', 'workspace_id'),
        Index('ix_conversations_contact', 'contact_id'),
        Index('ix_conversations_status', 'status'),
        Index('ix_conversations_last_message', 'last_message_at'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id"), nullable=False)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=False)
    
    # Status
    status = Column(Enum(ConversationStatus), default=ConversationStatus.ACTIVE, nullable=False)
    
    # For automation pause
    automation_paused = Column(String(50), nullable=True)  # reason, null if not paused
    
    # Last message tracking
    last_message_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    workspace = relationship("Workspace", back_populates="conversations")
    contact = relationship("Contact", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Conversation(id={self.id}, status={self.status})>"


class MessageType(str, enum.Enum):
    """Message type enumeration."""
    EMAIL = "email"
    SMS = "sms"
    AUTO = "auto"  # Automated message


class MessageDirection(str, enum.Enum):
    """Message direction enumeration."""
    INBOUND = "inbound"
    OUTBOUND = "outbound"


class Message(Base):
    """Message model for all communications."""
    __tablename__ = "messages"
    
    __table_args__ = (
        Index('ix_messages_conversation', 'conversation_id'),
        Index('ix_messages_type', 'type'),
        Index('ix_messages_direction', 'direction'),
        Index('ix_messages_created_at', 'created_at'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False)
    
    # Message details
    type = Column(Enum(MessageType), nullable=False)
    direction = Column(Enum(MessageDirection), nullable=False)
    content = Column(Text, nullable=False)
    
    # Provider metadata
    provider_message_id = Column(String(255), nullable=True)  # External provider ID
    msg_metadata = Column(Text, nullable=True)  # JSON string for additional data
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")

    def __repr__(self):
        return f"<Message(id={self.id}, type={self.type}, direction={self.direction})>"

import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean, Index, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class IntegrationType(str, enum.Enum):
    """Integration type enumeration."""
    EMAIL_SENDGRID = "email_sendgrid"
    EMAIL_GMAIL = "email_gmail"
    SMS = "sms"
    CALENDAR = "calendar"
    STORAGE = "storage"
    WEBHOOK = "webhook"
    WHATSAPP = "whatsapp"
    SLACK = "slack"


class IntegrationStatus(str, enum.Enum):
    """Integration status enumeration."""
    PENDING = "pending"
    ACTIVE = "active"
    ERROR = "error"


class Integration(Base):
    """Integration model for external services."""
    __tablename__ = "integrations"
    
    __table_args__ = (
        Index('ix_integrations_workspace_type', 'workspace_id', 'type', unique=True),
        Index('ix_integrations_status', 'status'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=False)
    type = Column(Enum(IntegrationType), nullable=False)
    name = Column(String(255), nullable=False)
    
    # Configuration (JSONB for flexibility)
    config = Column(JSONB, nullable=False, default=dict)
    
    # Status
    status = Column(Enum(IntegrationStatus), default=IntegrationStatus.PENDING, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_used_at = Column(DateTime, nullable=True)

    # Relationships
    workspace = relationship("Workspace", back_populates="integrations")

    def __repr__(self):
        return f"<Integration(id={self.id}, type={self.type}, status={self.status})>"

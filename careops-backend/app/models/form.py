import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean, Index, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class FormType(str, enum.Enum):
    """Form type enumeration."""
    INTAKE = "intake"
    AGREEMENT = "agreement"
    DOCUMENT = "document"


class FormStatus(str, enum.Enum):
    """Form status enumeration."""
    PENDING = "pending"
    SENT = "sent"
    COMPLETED = "completed"
    OVERDUE = "overdue"


class Form(Base):
    """Form model - documents to be filled/signed."""
    __tablename__ = "forms"
    
    __table_args__ = (
        Index('ix_forms_workspace', 'workspace_id'),
        Index('ix_forms_type', 'type'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=False)
    
    # Form details
    name = Column(String(255), nullable=False)
    type = Column(Enum(FormType), nullable=False)
    description = Column(Text, nullable=True)
    
    # File storage
    file_url = Column(String(500), nullable=False)
    
    # Required flag
    required = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    workspace = relationship("Workspace", back_populates="forms")

    def __repr__(self):
        return f"<Form(id={self.id}, name={self.name}, type={self.type})>"


class BookingForm(Base):
    """Booking form tracking - which forms to send after booking."""
    __tablename__ = "booking_forms"
    
    __table_args__ = (
        Index('ix_booking_forms_booking', 'booking_id'),
        Index('ix_booking_forms_form', 'form_id'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=False)
    form_id = Column(UUID(as_uuid=True), ForeignKey("forms.id"), nullable=False)
    
    # Status
    status = Column(Enum(FormStatus), default=FormStatus.PENDING, nullable=False)
    
    # File upload
    file_url = Column(String(500), nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    booking = relationship("Booking")
    form = relationship("Form")

    def __repr__(self):
        return f"<BookingForm(id={self.id}, booking_id={self.booking_id}, status={self.status})>"

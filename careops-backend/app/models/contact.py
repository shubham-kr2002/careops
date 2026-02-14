import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Contact(Base):
    """Contact model for customers - no login required."""
    __tablename__ = "contacts"
    
    __table_args__ = (
        Index('ix_contacts_workspace', 'workspace_id'),
        Index('ix_contacts_email', 'email'),
        Index('ix_contacts_phone', 'phone'),
        Index('ix_contacts_created_at', 'created_at'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=False)
    
    # Contact information
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    
    # Source tracking
    source = Column(String(50), nullable=False, default="manual")  # contact_form, booking_page, manual
    
    # Additional info
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    workspace = relationship("Workspace", back_populates="contacts")
    bookings = relationship("Booking", back_populates="contact", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="contact", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Contact(id={self.id}, name={self.name}, email={self.email})>"

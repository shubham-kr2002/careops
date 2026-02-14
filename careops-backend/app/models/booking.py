import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Integer, Boolean, Index, Enum
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class BookingStatus(str, enum.Enum):
    """Booking status enumeration."""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    NO_SHOW = "no_show"
    CANCELLED = "cancelled"


class BookingType(Base):
    """Booking type model - services offered by the business."""
    __tablename__ = "booking_types"
    
    __table_args__ = (
        Index('ix_booking_types_workspace', 'workspace_id'),
        Index('ix_booking_types_active', 'is_active'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=False)
    
    # Service details
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    duration = Column(Integer, nullable=False)  # in minutes
    
    # Location
    location = Column(String(255), nullable=True)  # for in-person services
    is_virtual = Column(Boolean, default=False, nullable=False)
    
    # Form IDs to send after booking
    form_ids = Column(ARRAY(UUID), default=[], nullable=True)
    
    # Pricing
    price = Column(String(50), nullable=True)  # as string for flexibility
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<BookingType(id={self.id}, name={self.name}, duration={self.duration}min)>"


class Availability(Base):
    """Availability model - when services can be booked."""
    __tablename__ = "availability"
    
    __table_args__ = (
        Index('ix_availability_booking_type', 'booking_type_id'),
        Index('ix_availability_day', 'day_of_week'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_type_id = Column(UUID(as_uuid=True), ForeignKey("booking_types.id"), nullable=False)
    
    # Day of week (0=Sunday, 6=Saturday)
    day_of_week = Column(Integer, nullable=False)
    
    # Time range
    start_time = Column(String(10), nullable=False)  # "HH:MM" format
    end_time = Column(String(10), nullable=False)   # "HH:MM" format
    
    # Buffer time between appointments
    buffer_minutes = Column(Integer, default=0, nullable=False)

    def __repr__(self):
        return f"<Availability(id={self.id}, day={self.day_of_week}, {self.start_time}-{self.end_time})>"


class Booking(Base):
    """Booking model - scheduled appointments."""
    __tablename__ = "bookings"
    
    __table_args__ = (
        Index('ix_bookings_workspace', 'workspace_id'),
        Index('ix_bookings_contact', 'contact_id'),
        Index('ix_bookings_type', 'booking_type_id'),
        Index('ix_bookings_status', 'status'),
        Index('ix_bookings_scheduled', 'scheduled_at'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id"), nullable=False)
    booking_type_id = Column(UUID(as_uuid=True), ForeignKey("booking_types.id"), nullable=False)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=False)
    
    # Booking details
    scheduled_at = Column(DateTime, nullable=False)
    status = Column(Enum(BookingStatus), default=BookingStatus.CONFIRMED, nullable=False)
    
    # Location
    location = Column(String(255), nullable=True)
    is_virtual = Column(Boolean, default=False, nullable=False)
    meeting_link = Column(String(500), nullable=True)
    
    # Customer notes
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    workspace = relationship("Workspace", back_populates="bookings")
    contact = relationship("Contact", back_populates="bookings")
    booking_type = relationship("BookingType", back_populates="bookings")
    jobs = relationship("Job", back_populates="booking", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Booking(id={self.id}, status={self.status}, scheduled={self.scheduled_at})>"


# Add back_populates to BookingType
BookingType.bookings = relationship("Booking", back_populates="booking_type", cascade="all, delete-orphan")
BookingType.workspace = relationship("Workspace", back_populates="booking_types")
BookingType.availability = relationship("Availability", back_populates="booking_type", cascade="all, delete-orphan")

# Add back_populates to Availability
Availability.booking_type = relationship("BookingType", back_populates="availability")

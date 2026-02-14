"""
Bookings Router - Handles booking types and appointment scheduling
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime

from app.database import get_db
from app.models.booking import Booking, BookingType, Availability, BookingStatus
from app.models.workspace import Workspace
from app.models.user import User
from app.core.security import get_current_user
from app.schemas.booking import (
    BookingTypeCreate,
    BookingTypeUpdate,
    BookingTypeResponse,
    AvailabilityCreate,
    AvailabilityResponse,
    BookingCreate,
    BookingResponse
)

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


def get_workspace(db: Session, current_user: User):
    """Get the current user's workspace."""
    workspace = db.query(Workspace).filter(Workspace.owner_id == current_user.id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace


# Booking Types Endpoints
@router.post("/types", response_model=BookingTypeResponse, status_code=status.HTTP_201_CREATED)
def create_booking_type(
    booking_type_data: BookingTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new booking type (service)."""
    workspace = get_workspace(db, current_user)
    
    booking_type = BookingType(
        workspace_id=workspace.id,
        name=booking_type_data.name,
        description=booking_type_data.description,
        duration=booking_type_data.duration,
        location=booking_type_data.location,
        is_virtual=booking_type_data.is_virtual,
        price=booking_type_data.price,
        is_active=True
    )
    db.add(booking_type)
    db.commit()
    db.refresh(booking_type)
    return booking_type


@router.get("/types", response_model=List[BookingTypeResponse])
def list_booking_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all booking types for the workspace."""
    workspace = get_workspace(db, current_user)
    return db.query(BookingType).filter(BookingType.workspace_id == workspace.id).all()


@router.get("/types/{booking_type_id}", response_model=BookingTypeResponse)
def get_booking_type(
    booking_type_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific booking type."""
    workspace = get_workspace(db, current_user)
    booking_type = db.query(BookingType).filter(
        BookingType.id == booking_type_id,
        BookingType.workspace_id == workspace.id
    ).first()
    
    if not booking_type:
        raise HTTPException(status_code=404, detail="Booking type not found")
    return booking_type


@router.patch("/types/{booking_type_id}", response_model=BookingTypeResponse)
def update_booking_type(
    booking_type_id: UUID,
    booking_type_data: BookingTypeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a booking type."""
    workspace = get_workspace(db, current_user)
    booking_type = db.query(BookingType).filter(
        BookingType.id == booking_type_id,
        BookingType.workspace_id == workspace.id
    ).first()
    
    if not booking_type:
        raise HTTPException(status_code=404, detail="Booking type not found")
    
    for field, value in booking_type_data.model_dump(exclude_unset=True).items():
        setattr(booking_type, field, value)
    
    db.commit()
    db.refresh(booking_type)
    return booking_type


@router.delete("/types/{booking_type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_booking_type(
    booking_type_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a booking type."""
    workspace = get_workspace(db, current_user)
    booking_type = db.query(BookingType).filter(
        BookingType.id == booking_type_id,
        BookingType.workspace_id == workspace.id
    ).first()
    
    if not booking_type:
        raise HTTPException(status_code=404, detail="Booking type not found")
    
    db.delete(booking_type)
    db.commit()


# Availability Endpoints
@router.post("/types/{booking_type_id}/availability", response_model=AvailabilityResponse)
def add_availability(
    booking_type_id: UUID,
    availability_data: AvailabilityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add availability for a booking type."""
    workspace = get_workspace(db, current_user)
    booking_type = db.query(BookingType).filter(
        BookingType.id == booking_type_id,
        BookingType.workspace_id == workspace.id
    ).first()
    
    if not booking_type:
        raise HTTPException(status_code=404, detail="Booking type not found")
    
    availability = Availability(
        booking_type_id=booking_type_id,
        day_of_week=availability_data.day_of_week,
        start_time=availability_data.start_time,
        end_time=availability_data.end_time,
        buffer_minutes=availability_data.buffer_minutes or 0
    )
    db.add(availability)
    db.commit()
    db.refresh(availability)
    return availability


# Booking Endpoints
@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    booking_data: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new booking (appointment)."""
    workspace = get_workspace(db, current_user)
    
    # Verify booking type exists
    booking_type = db.query(BookingType).filter(
        BookingType.id == booking_data.booking_type_id,
        BookingType.workspace_id == workspace.id
    ).first()
    
    if not booking_type:
        raise HTTPException(status_code=404, detail="Booking type not found")
    
    booking = Booking(
        contact_id=booking_data.contact_id,
        booking_type_id=booking_data.booking_type_id,
        workspace_id=workspace.id,
        scheduled_at=booking_data.scheduled_at,
        location=booking_data.location,
        is_virtual=booking_data.is_virtual,
        meeting_link=booking_data.meeting_link,
        notes=booking_data.notes,
        status=BookingStatus.CONFIRMED
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    
    # Trigger automation event for new booking
    try:
        from app.services.automation_service import AutomationService
        automation_service = AutomationService(db)
        import asyncio
        asyncio.get_event_loop().run_until_complete(
            automation_service.on_booking_created(booking)
        )
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Automation trigger failed: {str(e)}")
    
    return booking


@router.get("/", response_model=List[BookingResponse])
def list_bookings(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all bookings for the workspace."""
    workspace = get_workspace(db, current_user)
    return db.query(Booking).filter(
        Booking.workspace_id == workspace.id
    ).order_by(Booking.scheduled_at.desc()).offset(skip).limit(limit).all()


@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific booking."""
    workspace = get_workspace(db, current_user)
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.workspace_id == workspace.id
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking

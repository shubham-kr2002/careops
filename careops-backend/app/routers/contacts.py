"""
Contacts Router - Handles customer contact management (no login required for customers)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database import get_db
from app.models.contact import Contact
from app.models.workspace import Workspace
from app.models.user import User
from app.core.security import get_current_user
from app.schemas.contact import (
    ContactCreate,
    ContactUpdate,
    ContactResponse
)

router = APIRouter(prefix="/api/contacts", tags=["contacts"])


def get_workspace(db: Session, current_user: User):
    """Get the current user's workspace."""
    workspace = db.query(Workspace).filter(Workspace.owner_id == current_user.id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace


@router.post("/", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
def create_contact(
    contact_data: ContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new contact (customer)."""
    workspace = get_workspace(db, current_user)
    
    contact = Contact(
        workspace_id=workspace.id,
        name=contact_data.name,
        email=contact_data.email,
        phone=contact_data.phone,
        source=contact_data.source or "manual",
        notes=contact_data.notes
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    
    # Trigger automation event for new contact
    try:
        from app.services.automation_service import AutomationService
        automation_service = AutomationService(db)
        # Run async function in sync context
        import asyncio
        asyncio.get_event_loop().run_until_complete(
            automation_service.on_contact_created(contact)
        )
    except Exception as e:
        # Log but don't fail the request
        import logging
        logging.getLogger(__name__).error(f"Automation trigger failed: {str(e)}")
    
    return contact


@router.get("/", response_model=List[ContactResponse])
def list_contacts(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all contacts for the workspace."""
    workspace = get_workspace(db, current_user)
    return db.query(Contact).filter(
        Contact.workspace_id == workspace.id
    ).offset(skip).limit(limit).all()


@router.get("/{contact_id}", response_model=ContactResponse)
def get_contact(
    contact_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific contact."""
    workspace = get_workspace(db, current_user)
    contact = db.query(Contact).filter(
        Contact.id == contact_id,
        Contact.workspace_id == workspace.id
    ).first()
    
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact


@router.patch("/{contact_id}", response_model=ContactResponse)
def update_contact(
    contact_id: UUID,
    contact_data: ContactUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a contact."""
    workspace = get_workspace(db, current_user)
    contact = db.query(Contact).filter(
        Contact.id == contact_id,
        Contact.workspace_id == workspace.id
    ).first()
    
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    for field, value in contact_data.model_dump(exclude_unset=True).items():
        setattr(contact, field, value)
    
    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(
    contact_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a contact."""
    workspace = get_workspace(db, current_user)
    contact = db.query(Contact).filter(
        Contact.id == contact_id,
        Contact.workspace_id == workspace.id
    ).first()
    
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    db.delete(contact)
    db.commit()

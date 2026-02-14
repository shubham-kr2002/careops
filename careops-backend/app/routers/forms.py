"""
Forms Router - Handles forms and document management
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database import get_db
from app.models.form import Form, BookingForm, FormStatus, FormType
from app.models.workspace import Workspace
from app.models.user import User
from app.core.security import get_current_user
from app.schemas.form import (
    FormCreate,
    FormUpdate,
    FormResponse,
    BookingFormResponse
)

router = APIRouter(prefix="/api/v1/forms", tags=["forms"])


def get_workspace(db: Session, current_user: User):
    """Get the current user's workspace (supports both owner and staff)."""
    workspace = db.query(Workspace).filter(Workspace.owner_id == current_user.id).first()
    if not workspace and current_user.workspace_id:
        workspace = db.query(Workspace).filter(Workspace.id == current_user.workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace


@router.post("/", response_model=FormResponse, status_code=status.HTTP_201_CREATED)
def create_form(
    form_data: FormCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new form (intake, agreement, document)."""
    workspace = get_workspace(db, current_user)
    
    form = Form(
        workspace_id=workspace.id,
        name=form_data.name,
        type=form_data.type,
        description=form_data.description,
        file_url=form_data.file_url,
        required=form_data.required or True
    )
    db.add(form)
    db.commit()
    db.refresh(form)
    return form


@router.get("/", response_model=List[FormResponse])
def list_forms(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all forms for the workspace."""
    workspace = get_workspace(db, current_user)
    return db.query(Form).filter(Form.workspace_id == workspace.id).offset(skip).limit(limit).all()


@router.get("/{form_id}", response_model=FormResponse)
def get_form(
    form_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific form."""
    workspace = get_workspace(db, current_user)
    form = db.query(Form).filter(
        Form.id == form_id,
        Form.workspace_id == workspace.id
    ).first()
    
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return form


@router.patch("/{form_id}", response_model=FormResponse)
def update_form(
    form_id: UUID,
    form_data: FormUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a form."""
    workspace = get_workspace(db, current_user)
    form = db.query(Form).filter(
        Form.id == form_id,
        Form.workspace_id == workspace.id
    ).first()
    
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    
    for field, value in form_data.model_dump(exclude_unset=True).items():
        setattr(form, field, value)
    
    db.commit()
    db.refresh(form)
    return form


@router.delete("/{form_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_form(
    form_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a form."""
    workspace = get_workspace(db, current_user)
    form = db.query(Form).filter(
        Form.id == form_id,
        Form.workspace_id == workspace.id
    ).first()
    
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    
    db.delete(form)
    db.commit()

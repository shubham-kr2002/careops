"""
Integrations Router - Handles external service integrations (email, SMS, calendar, etc.)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database import get_db
from app.models.integration import Integration, IntegrationType, IntegrationStatus
from app.models.workspace import Workspace
from app.models.user import User
from app.core.security import get_current_user
from app.schemas.integration import (
    IntegrationCreate,
    IntegrationUpdate,
    IntegrationResponse
)

router = APIRouter(prefix="/api/integrations", tags=["integrations"])


def get_workspace_workspace(db: Session, current_user: User):
    """Get the current user's workspace."""
    workspace = db.query(Workspace).filter(Workspace.owner_id == current_user.id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace


@router.post("/", response_model=IntegrationResponse, status_code=status.HTTP_201_CREATED)
def create_integration(
    integration_data: IntegrationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new integration for the workspace."""
    workspace = get_workspace_workspace(db, current_user)
    
    # Check if integration type already exists for workspace
    existing = db.query(Integration).filter(
        Integration.workspace_id == workspace.id,
        Integration.type == integration_data.type
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Integration of type {integration_data.type} already exists"
        )
    
    integration = Integration(
        workspace_id=workspace.id,
        type=integration_data.type,
        name=integration_data.name,
        config=integration_data.config,
        status=IntegrationStatus.PENDING
    )
    db.add(integration)
    db.commit()
    db.refresh(integration)
    return integration


@router.get("/", response_model=List[IntegrationResponse])
def list_integrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all integrations for the workspace."""
    workspace = get_workspace_workspace(db, current_user)
    return db.query(Integration).filter(Integration.workspace_id == workspace.id).all()


@router.get("/{integration_id}", response_model=IntegrationResponse)
def get_integration(
    integration_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific integration."""
    workspace = get_workspace_workspace(db, current_user)
    integration = db.query(Integration).filter(
        Integration.id == integration_id,
        Integration.workspace_id == workspace.id
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    return integration


@router.patch("/{integration_id}", response_model=IntegrationResponse)
def update_integration(
    integration_id: UUID,
    integration_data: IntegrationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an integration."""
    workspace = get_workspace_workspace(db, current_user)
    integration = db.query(Integration).filter(
        Integration.id == integration_id,
        Integration.workspace_id == workspace.id
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    for field, value in integration_data.model_dump(exclude_unset=True).items():
        setattr(integration, field, value)
    
    db.commit()
    db.refresh(integration)
    return integration


@router.delete("/{integration_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_integration(
    integration_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an integration."""
    workspace = get_workspace_workspace(db, current_user)
    integration = db.query(Integration).filter(
        Integration.id == integration_id,
        Integration.workspace_id == workspace.id
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    db.delete(integration)
    db.commit()

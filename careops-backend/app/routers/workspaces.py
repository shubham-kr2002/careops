"""
Workspace Router - Handles workspace creation and management
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app.models.workspace import Workspace
from app.models.user import User
from app.core.security import get_current_user
from app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceUpdate,
    WorkspaceResponse,
    WorkspaceActivation
)

router = APIRouter(prefix="/api/workspaces", tags=["workspaces"])


@router.post("/", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
def create_workspace(
    workspace_data: WorkspaceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new workspace for the current user."""
    workspace = Workspace(
        name=workspace_data.name,
        address=workspace_data.address,
        timezone=workspace_data.timezone,
        contact_email=workspace_data.contact_email,
        owner_id=current_user.id,
        status="pending"
    )
    db.add(workspace)
    db.commit()
    db.refresh(workspace)
    return workspace


@router.get("/me", response_model=WorkspaceResponse)
def get_my_workspace(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the current user's workspace."""
    workspace = db.query(Workspace).filter(Workspace.owner_id == current_user.id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace


@router.patch("/me", response_model=WorkspaceResponse)
def update_my_workspace(
    workspace_data: WorkspaceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update the current user's workspace."""
    workspace = db.query(Workspace).filter(Workspace.owner_id == current_user.id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    for field, value in workspace_data.model_dump(exclude_unset=True).items():
        setattr(workspace, field, value)
    
    db.commit()
    db.refresh(workspace)
    return workspace


@router.post("/activate", response_model=WorkspaceResponse)
def activate_workspace(
    activation_data: WorkspaceActivation,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Activate the workspace to enable all features."""
    workspace = db.query(Workspace).filter(Workspace.owner_id == current_user.id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    # Verify required onboarding steps are complete
    required_steps = ["integrations", "booking_types", "staff"]
    missing = [step for step in required_steps if not getattr(activation_data, step, False)]
    
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot activate workspace. Missing required setup: {', '.join(missing)}"
        )
    
    workspace.status = "active"
    db.commit()
    db.refresh(workspace)
    return workspace

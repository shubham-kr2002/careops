"""
Workspace Router - Handles workspace creation and management
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
import re
import uuid as uuid_mod

from app.database import get_db
from app.models.workspace import Workspace, WorkspaceStatus
from app.models.user import User
from app.core.security import get_current_user
from app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceUpdate,
    WorkspaceResponse,
    WorkspaceActivation
)

router = APIRouter(prefix="/api/v1/workspaces", tags=["workspaces"])


@router.post("/", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
def create_workspace(
    workspace_data: WorkspaceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new workspace for the current user."""
    # Auto-generate slug from workspace name
    base_slug = re.sub(r'[^a-z0-9]+', '-', workspace_data.name.lower()).strip('-')
    slug = base_slug
    # Ensure uniqueness
    existing = db.query(Workspace).filter(Workspace.slug == slug).first()
    if existing:
        slug = f"{base_slug}-{uuid_mod.uuid4().hex[:6]}"
    
    workspace = Workspace(
        name=workspace_data.name,
        slug=slug,
        description=getattr(workspace_data, 'description', None),
        address=workspace_data.address,
        phone=getattr(workspace_data, 'phone', None),
        timezone=workspace_data.timezone,
        contact_email=workspace_data.contact_email,
        owner_id=current_user.id,
        status=WorkspaceStatus.PENDING
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
    
    workspace.status = WorkspaceStatus.ACTIVE
    db.commit()
    db.refresh(workspace)
    return workspace

"""
Staff Router - Handles staff user management (owner only)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User, StaffPermission, UserRole
from app.models.workspace import Workspace
from app.core.security import get_current_user, require_owner
from app.core.security import get_password_hash

router = APIRouter(prefix="/api/staff", tags=["staff"])


class StaffPermissionCreate(BaseModel):
    """Schema for creating staff permissions."""
    can_inbox: bool = True
    can_bookings: bool = True
    can_forms: bool = True
    can_inventory: bool = False


class StaffCreate(BaseModel):
    """Schema for creating a staff user."""
    email: str
    name: str
    password: str
    permissions: StaffPermissionCreate


class StaffResponse(BaseModel):
    """Schema for staff user response."""
    id: UUID
    email: str
    name: str
    role: str
    is_active: bool
    permissions: dict

    class Config:
        from_attributes = True


class StaffUpdate(BaseModel):
    """Schema for updating a staff user."""
    name: str = None
    is_active: bool = None
    permissions: StaffPermissionCreate = None


def get_workspace(db: Session, current_user: User) -> Workspace:
    """Get the current user's workspace."""
    workspace = db.query(Workspace).filter(Workspace.owner_id == current_user.id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace


@router.post("/", response_model=StaffResponse, status_code=status.HTTP_201_CREATED)
def create_staff(
    staff_data: StaffCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner)
):
    """
    Create a new staff user (owner only).
    """
    workspace = get_workspace(db, current_user)
    
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == staff_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create staff user
    staff = User(
        email=staff_data.email,
        name=staff_data.name,
        password_hash=get_password_hash(staff_data.password),
        role=UserRole.STAFF,
        workspace_id=workspace.id
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)
    
    # Create staff permissions
    permissions = StaffPermission(
        user_id=staff.id,
        can_inbox=staff_data.permissions.can_inbox,
        can_bookings=staff_data.permissions.can_bookings,
        can_forms=staff_data.permissions.can_forms,
        can_inventory=staff_data.permissions.can_inventory
    )
    db.add(permissions)
    db.commit()
    db.refresh(staff)
    
    return StaffResponse(
        id=staff.id,
        email=staff.email,
        name=staff.name,
        role=staff.role.value,
        is_active=staff.is_active,
        permissions={
            "can_inbox": permissions.can_inbox,
            "can_bookings": permissions.can_bookings,
            "can_forms": permissions.can_forms,
            "can_inventory": permissions.can_inventory
        }
    )


@router.get("/", response_model=List[StaffResponse])
def list_staff(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner)
):
    """
    List all staff users for the workspace (owner only).
    """
    workspace = get_workspace(db, current_user)
    
    staff = db.query(User).filter(
        User.workspace_id == workspace.id,
        User.role == UserRole.STAFF
    ).all()
    
    result = []
    for s in staff:
        perms = s.permissions
        result.append(StaffResponse(
            id=s.id,
            email=s.email,
            name=s.name,
            role=s.role.value,
            is_active=s.is_active,
            permissions={
                "can_inbox": perms.can_inbox if perms else True,
                "can_bookings": perms.can_bookings if perms else True,
                "can_forms": perms.can_forms if perms else True,
                "can_inventory": perms.can_inventory if perms else False
            }
        ))
    
    return result


@router.get("/{staff_id}", response_model=StaffResponse)
def get_staff(
    staff_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner)
):
    """
    Get a specific staff user (owner only).
    """
    workspace = get_workspace(db, current_user)
    
    staff = db.query(User).filter(
        User.id == staff_id,
        User.workspace_id == workspace.id,
        User.role == UserRole.STAFF
    ).first()
    
    if not staff:
        raise HTTPException(status_code=404, detail="Staff user not found")
    
    perms = staff.permissions
    return StaffResponse(
        id=staff.id,
        email=staff.email,
        name=staff.name,
        role=staff.role.value,
        is_active=staff.is_active,
        permissions={
            "can_inbox": perms.can_inbox if perms else True,
            "can_bookings": perms.can_bookings if perms else True,
            "can_forms": perms.can_forms if perms else True,
            "can_inventory": perms.can_inventory if perms else False
        }
    )


@router.patch("/{staff_id}", response_model=StaffResponse)
def update_staff(
    staff_id: UUID,
    staff_data: StaffUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner)
):
    """
    Update a staff user (owner only).
    """
    workspace = get_workspace(db, current_user)
    
    staff = db.query(User).filter(
        User.id == staff_id,
        User.workspace_id == workspace.id,
        User.role == UserRole.STAFF
    ).first()
    
    if not staff:
        raise HTTPException(status_code=404, detail="Staff user not found")
    
    # Update basic fields
    if staff_data.name is not None:
        staff.name = staff_data.name
    if staff_data.is_active is not None:
        staff.is_active = staff_data.is_active
    
    # Update permissions if provided
    if staff_data.permissions is not None:
        perms = staff.permissions
        if perms:
            perms.can_inbox = staff_data.permissions.can_inbox
            perms.can_bookings = staff_data.permissions.can_bookings
            perms.can_forms = staff_data.permissions.can_forms
            perms.can_inventory = staff_data.permissions.can_inventory
    
    db.commit()
    db.refresh(staff)
    
    perms = staff.permissions
    return StaffResponse(
        id=staff.id,
        email=staff.email,
        name=staff.name,
        role=staff.role.value,
        is_active=staff.is_active,
        permissions={
            "can_inbox": perms.can_inbox if perms else True,
            "can_bookings": perms.can_bookings if perms else True,
            "can_forms": perms.can_forms if perms else True,
            "can_inventory": perms.can_inventory if perms else False
        }
    )


@router.delete("/{staff_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_staff(
    staff_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner)
):
    """
    Delete a staff user (owner only).
    """
    workspace = get_workspace(db, current_user)
    
    staff = db.query(User).filter(
        User.id == staff_id,
        User.workspace_id == workspace.id,
        User.role == UserRole.STAFF
    ).first()
    
    if not staff:
        raise HTTPException(status_code=404, detail="Staff user not found")
    
    db.delete(staff)
    db.commit()

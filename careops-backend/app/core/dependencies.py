from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from uuid import UUID
from app.database import get_db
from app.core.security import verify_token
from app.models.user import User, UserRole

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """
    Get current authenticated user from JWT token.
    
    Args:
        credentials: HTTP Authorization credentials
        db: Database session
    
    Returns:
        User object if authenticated
    
    Raises:
        HTTPException: If token is invalid or user not found
    """
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == UUID(user_id)).first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )
    
    return user


def get_current_active_user(current_user: User = Depends(get_current_user)):
    """
    Get current active user.
    
    Args:
        current_user: Current authenticated user
    
    Returns:
        User object if active
    
    Raises:
        HTTPException: If user is inactive
    """
    return current_user


def require_owner(current_user: User = Depends(get_current_user)):
    """
    Require current user to be an owner.
    
    Args:
        current_user: Current authenticated user
    
    Returns:
        User object if owner
    
    Raises:
        HTTPException: If user is not an owner
    """
    if current_user.role != UserRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Owner access required",
        )
    return current_user


def require_staff(current_user: User = Depends(get_current_user)):
    """
    Require current user to be staff or owner.
    
    Args:
        current_user: Current authenticated user
    
    Returns:
        User object if staff or owner
    
    Raises:
        HTTPException: If user is not staff or owner
    """
    if current_user.role not in [UserRole.OWNER, UserRole.STAFF]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff access required",
        )
    return current_user


def get_current_workspace_id(current_user: User = Depends(get_current_user)) -> str:
    """
    Get current user's workspace ID.
    
    Args:
        current_user: Current authenticated user
    
    Returns:
        Workspace ID string
    
    Raises:
        HTTPException: If user has no workspace
    """
    if not current_user.workspace_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with a workspace",
        )
    return str(current_user.workspace_id)


def check_permission(permission: str):
    """
    Dependency factory to check specific staff permissions.
    
    Args:
        permission: Permission name to check (e.g., 'can_inbox', 'can_bookings')
    
    Returns:
        Dependency function
    """
    def permission_checker(current_user: User = Depends(get_current_user)):
        # Owners have all permissions
        if current_user.role == UserRole.OWNER:
            return current_user
        
        # Staff need specific permission
        if current_user.role == UserRole.STAFF and current_user.permissions:
            if getattr(current_user.permissions, permission, False):
                return current_user
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied: {permission} required",
        )
    
    return permission_checker


# Pre-defined permission checks
can_access_inbox = check_permission("can_inbox")
can_manage_bookings = check_permission("can_bookings")
can_manage_forms = check_permission("can_forms")
can_manage_inventory = check_permission("can_inventory")

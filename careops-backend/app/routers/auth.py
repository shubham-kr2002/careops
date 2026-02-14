from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
import re
import secrets
import hashlib
import time

from app.database import get_db
from app.schemas.auth import LoginRequest, UserCreate, UserResponse, Token
from app.models.user import User, UserRole, StaffPermission
from app.models.workspace import Workspace, WorkspaceStatus
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.limiter import limiter
from app.core.exceptions import AuthenticationError, ValidationError
from app.core.dependencies import get_current_user
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password strength.
    Returns (is_valid, error_message).
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r"\d", password):
        return False, "Password must contain at least one digit"
    
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character"
    
    return True, ""


def constant_time_compare(val1: str, val2: str) -> bool:
    """
    Compare two strings in constant time to prevent timing attacks.
    """
    return secrets.compare_digest(val1.encode(), val2.encode())


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(settings.RATE_LIMIT_REGISTER)
async def register(request: Request, user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user with workspace.
    Rate limited to 3 attempts per minute to prevent abuse.
    
    First user becomes workspace owner. Workspace is created automatically.
    """
    # Check if email already exists (case-insensitive)
    existing_user = db.query(User).filter(
        func.lower(User.email) == func.lower(user_data.email)
    ).first()
    if existing_user:
        raise ValidationError("Email already registered")
    
    # Validate password strength
    is_valid, error_msg = validate_password_strength(user_data.password)
    if not is_valid:
        raise ValidationError(error_msg)
    
    try:
        # Create workspace first
        workspace = Workspace(
            name=user_data.workspace_name or f"{user_data.name}'s Workspace",
            contact_email=user_data.email,
            status=WorkspaceStatus.ACTIVE
        )
        db.add(workspace)
        db.flush()  # Get workspace ID without committing
        
        # Create new user as owner
        hashed_password = get_password_hash(user_data.password)
        new_user = User(
            email=user_data.email.lower().strip(),
            password_hash=hashed_password,
            name=user_data.name,
            role=UserRole.OWNER,
            workspace_id=workspace.id,
            is_active=True
        )
        
        db.add(new_user)
        db.flush()  # Get user ID
        
        # Set workspace owner
        workspace.owner_id = new_user.id
        
        # Create default permissions for owner (full access)
        permissions = StaffPermission(
            user_id=new_user.id,
            can_inbox=True,
            can_bookings=True,
            can_forms=True,
            can_inventory=True
        )
        db.add(permissions)
        
        db.commit()
        db.refresh(new_user)
        
        return new_user
        
    except Exception as e:
        db.rollback()
        raise ValidationError(f"Registration failed: {str(e)}")


@router.post("/login", response_model=Token)
@limiter.limit(settings.RATE_LIMIT_LOGIN)
async def login(request: Request, login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user and return JWT token.
    Rate limited to 5 attempts per minute to prevent brute force.
    
    Uses constant-time comparison to prevent timing attacks.
    """
    # Find user by email (case-insensitive)
    user = db.query(User).filter(
        func.lower(User.email) == func.lower(login_data.email)
    ).first()
    
    # ALWAYS perform password verification to prevent timing attacks
    # Use a dummy hash if user doesn't exist
    dummy_hash = "$2b$12$abcdefghijklmnopqrstuvwxycdefghijklmnopqrstu"
    password_hash = user.password_hash if user else dummy_hash
    
    # Verify password (constant time)
    password_valid = verify_password(login_data.password, password_hash)
    
    # Check user exists and password is valid
    if not user or not password_valid:
        # Add small random delay to further prevent timing attacks
        time.sleep(secrets.randbelow(100) / 1000)  # 0-100ms random delay
        raise AuthenticationError("Invalid email or password")
    
    # Check if user is active
    if not user.is_active:
        raise AuthenticationError("Account is deactivated")
    
    # Check if workspace is active
    if user.workspace and user.workspace.status != WorkspaceStatus.ACTIVE:
        raise AuthenticationError("Workspace is not active")
    
    # Update last login
    user.last_login = datetime.utcnow()
    
    # Create JWT token with workspace context
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "workspace_id": str(user.workspace_id) if user.workspace_id else None,
        "role": user.role.value
    }
    access_token = create_access_token(data=token_data)
    
    db.commit()
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.JWT_EXPIRATION_HOURS * 3600
    )


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """
    Logout current user.
    Note: JWT tokens cannot be truly revoked server-side without a blacklist.
    Client should delete the token. Token will expire naturally.
    """
    # In a production system, you might want to add token to a blacklist
    # or use short-lived tokens with refresh tokens
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user information.
    """
    return current_user


@router.post("/refresh", response_model=Token)
async def refresh_token(current_user: User = Depends(get_current_user)):
    """
    Refresh JWT token.
    Returns a new token with extended expiry.
    """
    # Create new token
    token_data = {
        "sub": str(current_user.id),
        "email": current_user.email,
        "workspace_id": str(current_user.workspace_id) if current_user.workspace_id else None,
        "role": current_user.role.value
    }
    access_token = create_access_token(data=token_data)
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.JWT_EXPIRATION_HOURS * 3600
    )

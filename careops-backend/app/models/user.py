import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Boolean, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class UserRole(str, enum.Enum):
    """User role enumeration."""
    OWNER = "owner"
    STAFF = "staff"


class User(Base):
    """User model for authentication and authorization."""
    __tablename__ = "users"
    
    # Database indexes for performance
    __table_args__ = (
        Index('ix_users_workspace_email', 'workspace_id', 'email'),
        Index('ix_users_role', 'role'),
        Index('ix_users_created_at', 'created_at'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.STAFF, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Foreign keys
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    # Relationships
    workspace = relationship("Workspace", back_populates="users", foreign_keys="User.workspace_id")
    permissions = relationship("StaffPermission", back_populates="user", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"


class StaffPermission(Base):
    """Staff permissions model for granular access control."""
    __tablename__ = "staff_permissions"
    
    __table_args__ = (
        Index('ix_permissions_user', 'user_id'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    
    # Permissions - Using proper Boolean type (not String!)
    can_inbox = Column(Boolean, default=True, nullable=False)
    can_bookings = Column(Boolean, default=True, nullable=False)
    can_forms = Column(Boolean, default=True, nullable=False)
    can_inventory = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="permissions")

    def __repr__(self):
        return f"<StaffPermission(user_id={self.user_id})>"

"""
Integration Schemas - Pydantic models for integration API
"""
from pydantic import BaseModel
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime

from app.models.integration import IntegrationType, IntegrationStatus


class IntegrationBase(BaseModel):
    """Base integration schema."""
    type: IntegrationType
    name: str
    config: Dict[str, Any] = {}


class IntegrationCreate(IntegrationBase):
    """Schema for creating an integration."""
    pass


class IntegrationUpdate(BaseModel):
    """Schema for updating an integration."""
    name: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    status: Optional[IntegrationStatus] = None


class IntegrationResponse(IntegrationBase):
    """Schema for integration response."""
    id: UUID
    workspace_id: UUID
    status: IntegrationStatus
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_used_at: Optional[datetime] = None

    class Config:
        from_attributes = True

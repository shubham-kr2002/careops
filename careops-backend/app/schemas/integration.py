"""
Integration Schemas - Pydantic models for integration API
"""
from pydantic import BaseModel, model_validator
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime

from app.models.integration import IntegrationType, IntegrationStatus

# Keys that should be redacted in responses
SENSITIVE_CONFIG_KEYS = {"api_key", "secret", "token", "password", "access_token", "refresh_token", "client_secret"}


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

    @model_validator(mode="after")
    def redact_sensitive_config(self):
        """Redact sensitive keys from config in responses."""
        if self.config:
            redacted = {}
            for key, value in self.config.items():
                if key.lower() in SENSITIVE_CONFIG_KEYS and value:
                    redacted[key] = f"***{str(value)[-4:]}" if len(str(value)) > 4 else "****"
                else:
                    redacted[key] = value
            self.config = redacted
        return self

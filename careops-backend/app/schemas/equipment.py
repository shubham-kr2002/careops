"""
Equipment Schemas - Pydantic models for equipment & maintenance API
"""
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class EquipmentBase(BaseModel):
    """Base equipment schema."""
    name: str
    type: Optional[str] = None
    serial_number: Optional[str] = None
    purchase_date: Optional[datetime] = None
    maintenance_interval_days: int = 90
    notes: Optional[str] = None


class EquipmentCreate(EquipmentBase):
    """Schema for creating equipment."""
    pass


class EquipmentUpdate(BaseModel):
    """Schema for updating equipment."""
    name: Optional[str] = None
    type: Optional[str] = None
    serial_number: Optional[str] = None
    purchase_date: Optional[datetime] = None
    maintenance_interval_days: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class EquipmentResponse(EquipmentBase):
    """Schema for equipment response."""
    id: UUID
    workspace_id: UUID
    status: str
    usage_count: int
    last_maintained_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MaintenanceLogCreate(BaseModel):
    """Schema for creating a maintenance log."""
    maintenance_type: str = "routine"  # routine, repair, inspection
    cost: Optional[float] = None
    notes: Optional[str] = None


class MaintenanceLogResponse(BaseModel):
    """Schema for maintenance log response."""
    id: UUID
    equipment_id: UUID
    performed_at: datetime
    performed_by: Optional[UUID] = None
    maintenance_type: str
    cost: Optional[float] = None
    notes: Optional[str] = None
    next_due_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class MaintenancePrediction(BaseModel):
    """AI maintenance prediction for a single equipment."""
    equipment_id: str
    equipment_name: str
    risk_level: str  # "critical", "high", "medium", "low"
    days_until_due: int
    recommendation: str
    confidence: float = 1.0


class MaintenancePredictionResponse(BaseModel):
    """Response with all maintenance predictions."""
    predictions: List[MaintenancePrediction] = []
    method: str = "rule-based"
    total_equipment: int = 0
    items_needing_attention: int = 0

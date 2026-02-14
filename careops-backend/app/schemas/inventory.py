"""
Inventory Schemas - Pydantic models for inventory API
"""
from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal

from app.models.inventory import InventoryTransactionType


class InventoryItemBase(BaseModel):
    """Base inventory item schema."""
    name: str
    description: Optional[str] = None
    sku: Optional[str] = None
    category: Optional[str] = None
    total_quantity: Optional[Decimal] = Decimal("0")
    min_threshold: Optional[Decimal] = None
    unit_cost: Optional[Decimal] = None
    unit_price: Optional[Decimal] = None
    unit: Optional[str] = None


class InventoryItemCreate(InventoryItemBase):
    """Schema for creating an inventory item."""
    pass


class InventoryItemUpdate(BaseModel):
    """Schema for updating an inventory item. total_quantity is only modified via transactions."""
    name: Optional[str] = None
    description: Optional[str] = None
    sku: Optional[str] = None
    category: Optional[str] = None
    min_threshold: Optional[Decimal] = None
    unit_cost: Optional[Decimal] = None
    unit_price: Optional[Decimal] = None
    unit: Optional[str] = None


class InventoryItemResponse(InventoryItemBase):
    """Schema for inventory item response."""
    id: UUID
    workspace_id: UUID
    reserved_quantity: Decimal
    created_at: datetime
    updated_at: datetime
    # Computed fields
    available_quantity: float = 0
    is_low_stock: bool = False

    class Config:
        from_attributes = True


class InventoryTransactionBase(BaseModel):
    """Base inventory transaction schema."""
    item_id: UUID
    transaction_type: InventoryTransactionType
    quantity: Decimal
    job_id: Optional[UUID] = None
    booking_id: Optional[UUID] = None
    notes: Optional[str] = None


class InventoryTransactionCreate(InventoryTransactionBase):
    """Schema for creating an inventory transaction."""
    pass


class InventoryTransactionResponse(InventoryTransactionBase):
    """Schema for inventory transaction response."""
    id: UUID
    workspace_id: UUID
    reference_id: Optional[str] = None
    created_at: datetime
    created_by_id: Optional[UUID] = None

    class Config:
        from_attributes = True

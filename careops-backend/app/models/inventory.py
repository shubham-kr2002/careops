"""
Inventory Model - Tracks items, quantities, and transactions
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Text, Index, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
import enum

from app.database import Base


class InventoryTransactionType(str, enum.Enum):
    """Types of inventory transactions"""
    PURCHASE = "purchase"
    USE = "use"
    ADJUSTMENT = "adjustment"
    RESERVATION = "reservation"
    RELEASE = "release"
    RETURN = "return"


class InventoryItem(Base):
    """Inventory items that can be used in jobs/services"""
    __tablename__ = "inventory_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    sku = Column(String(100), nullable=True, index=True)
    category = Column(String(100), nullable=True, index=True)
    
    # Quantity tracking
    total_quantity = Column(Numeric(10, 2), nullable=False, default=0)
    reserved_quantity = Column(Numeric(10, 2), nullable=False, default=0)
    min_threshold = Column(Numeric(10, 2), nullable=True)  # Low stock alert threshold
    
    # Cost and pricing
    unit_cost = Column(Numeric(10, 2), nullable=True)
    unit_price = Column(Numeric(10, 2), nullable=True)
    
    # Metadata
    unit = Column(String(50), nullable=True)  # e.g., "pieces", "liters", "hours"
    metadata = Column(JSONB, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    workspace = relationship("Workspace", back_populates="inventory_items")
    transactions = relationship("InventoryTransaction", back_populates="item", cascade="all, delete-orphan")

    # Computed property for available quantity
    @property
    def available_quantity(self):
        return float(self.total_quantity or 0) - float(self.reserved_quantity or 0)

    @property
    def is_low_stock(self):
        if self.min_threshold is None:
            return False
        return self.available_quantity <= float(self.min_threshold)

    __table_args__ = (
        Index("ix_inventory_workspace_name", "workspace_id", "name"),
        Index("ix_inventory_workspace_category", "workspace_id", "category"),
        Index("ix_inventory_workspace_sku", "workspace_id", "sku"),
    )


class InventoryTransaction(Base):
    """Track all inventory movements"""
    __tablename__ = "inventory_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False)
    
    # Transaction details
    transaction_type = Column(SQLEnum(InventoryTransactionType), nullable=False)
    quantity = Column(Numeric(10, 2), nullable=False)
    
    # Reference to related entities
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="SET NULL"), nullable=True)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True)
    reference_id = Column(String(255), nullable=True)  # External reference
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    workspace = relationship("Workspace", back_populates="inventory_transactions")
    item = relationship("InventoryItem", back_populates="transactions")
    job = relationship("Job")
    booking = relationship("Booking")
    created_by = relationship("User")

    __table_args__ = (
        Index("ix_inventory_trans_workspace_date", "workspace_id", "created_at"),
        Index("ix_inventory_trans_item_date", "item_id", "created_at"),
        Index("ix_inventory_trans_job", "job_id"),
    )

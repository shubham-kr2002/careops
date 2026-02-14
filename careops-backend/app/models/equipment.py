"""
Equipment & Maintenance Models - Predictive maintenance tracking
"""
import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Integer, Index, Enum as SQLEnum, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class EquipmentStatus(str, enum.Enum):
    """Equipment status enumeration."""
    ACTIVE = "active"
    NEEDS_MAINTENANCE = "needs_maintenance"
    OUT_OF_SERVICE = "out_of_service"


class MaintenanceType(str, enum.Enum):
    """Maintenance type enumeration."""
    ROUTINE = "routine"
    REPAIR = "repair"
    INSPECTION = "inspection"


class Equipment(Base):
    """Equipment model for tracking service operation assets."""
    __tablename__ = "equipment"

    __table_args__ = (
        Index('ix_equipment_workspace', 'workspace_id'),
        Index('ix_equipment_status', 'workspace_id', 'status'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)

    # Equipment details
    name = Column(String(255), nullable=False)
    type = Column(String(100), nullable=True)  # "medical_device", "office", "tool"
    serial_number = Column(String(100), nullable=True)
    purchase_date = Column(DateTime, nullable=True)

    # Maintenance tracking
    last_maintained_at = Column(DateTime, nullable=True)
    maintenance_interval_days = Column(Integer, default=90, nullable=False)
    status = Column(SQLEnum(EquipmentStatus), default=EquipmentStatus.ACTIVE, nullable=False)

    # Usage tracking
    usage_count = Column(Integer, default=0, nullable=False)

    # Notes
    notes = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    workspace = relationship("Workspace", back_populates="equipment")
    maintenance_logs = relationship("MaintenanceLog", back_populates="equipment", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Equipment(id={self.id}, name={self.name}, status={self.status})>"


class MaintenanceLog(Base):
    """Maintenance log model for tracking maintenance history."""
    __tablename__ = "maintenance_logs"

    __table_args__ = (
        Index('ix_maintenance_logs_equipment', 'equipment_id'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    equipment_id = Column(UUID(as_uuid=True), ForeignKey("equipment.id", ondelete="CASCADE"), nullable=False)

    # Maintenance details
    performed_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    performed_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    maintenance_type = Column(SQLEnum(MaintenanceType), default=MaintenanceType.ROUTINE, nullable=False)
    cost = Column(Numeric(10, 2), nullable=True)
    notes = Column(Text, nullable=True)
    next_due_at = Column(DateTime, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    equipment = relationship("Equipment", back_populates="maintenance_logs")
    performed_by_user = relationship("User")

    def __repr__(self):
        return f"<MaintenanceLog(id={self.id}, equipment_id={self.equipment_id}, type={self.maintenance_type})>"

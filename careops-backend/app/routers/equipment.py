"""
Equipment Router - Equipment CRUD and predictive maintenance
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime, timedelta, timezone

from app.database import get_db
from app.models.workspace import Workspace
from app.models.user import User
from app.models.equipment import Equipment, MaintenanceLog, EquipmentStatus, MaintenanceType
from app.core.dependencies import get_current_user
from app.schemas.equipment import (
    EquipmentCreate,
    EquipmentUpdate,
    EquipmentResponse,
    MaintenanceLogCreate,
    MaintenanceLogResponse,
    MaintenancePrediction,
    MaintenancePredictionResponse,
)
from app.services.ai_service import ai_service

router = APIRouter(prefix="/api/v1/equipment", tags=["equipment"])


def _get_workspace(db: Session, current_user: User) -> Workspace:
    workspace = db.query(Workspace).filter(Workspace.owner_id == current_user.id).first()
    if not workspace:
        if current_user.workspace_id:
            workspace = db.query(Workspace).filter(Workspace.id == current_user.workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace


@router.post("/", response_model=EquipmentResponse, status_code=status.HTTP_201_CREATED)
def create_equipment(
    data: EquipmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create new equipment."""
    workspace = _get_workspace(db, current_user)

    equipment = Equipment(
        workspace_id=workspace.id,
        name=data.name,
        type=data.type,
        serial_number=data.serial_number,
        purchase_date=data.purchase_date,
        maintenance_interval_days=data.maintenance_interval_days,
        notes=data.notes,
        status=EquipmentStatus.ACTIVE,
    )
    db.add(equipment)
    db.commit()
    db.refresh(equipment)
    return equipment


@router.get("/", response_model=List[EquipmentResponse])
def list_equipment(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all equipment for the workspace."""
    workspace = _get_workspace(db, current_user)
    return db.query(Equipment).filter(Equipment.workspace_id == workspace.id).offset(skip).limit(limit).all()


@router.get("/maintenance-due", response_model=List[EquipmentResponse])
def list_maintenance_due(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List equipment that is past or near maintenance date."""
    workspace = _get_workspace(db, current_user)
    equipment = db.query(Equipment).filter(Equipment.workspace_id == workspace.id).all()

    due_items = []
    now = datetime.now(timezone.utc)
    for e in equipment:
        if e.last_maintained_at:
            next_due = e.last_maintained_at + timedelta(days=e.maintenance_interval_days)
            if next_due <= now + timedelta(days=14):  # Due within 14 days
                due_items.append(e)
        else:
            # Never maintained — if created more than interval ago, it's due
            if e.created_at + timedelta(days=e.maintenance_interval_days) <= now + timedelta(days=14):
                due_items.append(e)

    return due_items


@router.get("/{equipment_id}", response_model=EquipmentResponse)
def get_equipment(
    equipment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific equipment item."""
    workspace = _get_workspace(db, current_user)
    equipment = db.query(Equipment).filter(
        Equipment.id == equipment_id,
        Equipment.workspace_id == workspace.id,
    ).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return equipment


@router.patch("/{equipment_id}", response_model=EquipmentResponse)
def update_equipment(
    equipment_id: UUID,
    data: EquipmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update equipment."""
    workspace = _get_workspace(db, current_user)
    equipment = db.query(Equipment).filter(
        Equipment.id == equipment_id,
        Equipment.workspace_id == workspace.id,
    ).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        if field == "status":
            value = EquipmentStatus(value)
        setattr(equipment, field, value)

    db.commit()
    db.refresh(equipment)
    return equipment


@router.delete("/{equipment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_equipment(
    equipment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete equipment."""
    workspace = _get_workspace(db, current_user)
    equipment = db.query(Equipment).filter(
        Equipment.id == equipment_id,
        Equipment.workspace_id == workspace.id,
    ).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    db.delete(equipment)
    db.commit()


# ============ Maintenance Logs ============

@router.post("/{equipment_id}/maintenance", response_model=MaintenanceLogResponse, status_code=status.HTTP_201_CREATED)
def log_maintenance(
    equipment_id: UUID,
    data: MaintenanceLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Log a maintenance event for equipment."""
    workspace = _get_workspace(db, current_user)
    equipment = db.query(Equipment).filter(
        Equipment.id == equipment_id,
        Equipment.workspace_id == workspace.id,
    ).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    now = datetime.now(timezone.utc)
    next_due = now + timedelta(days=equipment.maintenance_interval_days)

    log = MaintenanceLog(
        equipment_id=equipment.id,
        performed_at=now,
        performed_by=current_user.id,
        maintenance_type=MaintenanceType(data.maintenance_type),
        cost=data.cost,
        notes=data.notes,
        next_due_at=next_due,
    )
    db.add(log)

    # Update equipment
    equipment.last_maintained_at = now
    equipment.status = EquipmentStatus.ACTIVE

    db.commit()
    db.refresh(log)
    return log


@router.get("/{equipment_id}/maintenance", response_model=List[MaintenanceLogResponse])
def list_maintenance_logs(
    equipment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List maintenance history for equipment."""
    workspace = _get_workspace(db, current_user)
    equipment = db.query(Equipment).filter(
        Equipment.id == equipment_id,
        Equipment.workspace_id == workspace.id,
    ).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    return db.query(MaintenanceLog).filter(
        MaintenanceLog.equipment_id == equipment_id,
    ).order_by(MaintenanceLog.performed_at.desc()).all()


# ============ Predictive Maintenance ============

@router.get("/predictions/all", response_model=MaintenancePredictionResponse)
async def get_maintenance_predictions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get AI-powered maintenance predictions for all equipment."""
    workspace = _get_workspace(db, current_user)
    all_equipment = db.query(Equipment).filter(Equipment.workspace_id == workspace.id).all()

    predictions = []
    now = datetime.now(timezone.utc)

    for e in all_equipment:
        # Calculate days until maintenance due
        if e.last_maintained_at:
            next_due = e.last_maintained_at + timedelta(days=e.maintenance_interval_days)
        else:
            next_due = e.created_at + timedelta(days=e.maintenance_interval_days)

        days_until = (next_due - now).days

        # Rule-based risk assessment
        if days_until < 0:
            risk = "critical"
            rec = f"OVERDUE by {abs(days_until)} days. Schedule maintenance immediately."
        elif days_until < 7:
            risk = "high"
            rec = f"Due in {days_until} days. Schedule maintenance this week."
        elif days_until < 14:
            risk = "medium"
            rec = f"Due in {days_until} days. Plan maintenance soon."
        else:
            risk = "low"
            rec = f"Next maintenance in {days_until} days. On track."

        predictions.append(MaintenancePrediction(
            equipment_id=str(e.id),
            equipment_name=e.name,
            risk_level=risk,
            days_until_due=days_until,
            recommendation=rec,
            confidence=1.0,
        ))

    # Sort by risk: critical > high > medium > low
    risk_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    predictions.sort(key=lambda p: risk_order.get(p.risk_level, 4))

    needing_attention = sum(1 for p in predictions if p.risk_level in ("critical", "high", "medium"))

    return MaintenancePredictionResponse(
        predictions=predictions,
        method="rule-based",
        total_equipment=len(all_equipment),
        items_needing_attention=needing_attention,
    )

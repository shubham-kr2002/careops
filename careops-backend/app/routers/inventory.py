"""
Inventory Router - Handles inventory item management
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from decimal import Decimal

from app.database import get_db
from app.models.inventory import InventoryItem, InventoryTransaction, InventoryTransactionType
from app.models.workspace import Workspace
from app.models.user import User
from app.core.security import get_current_user
from app.schemas.inventory import (
    InventoryItemCreate,
    InventoryItemUpdate,
    InventoryItemResponse,
    InventoryTransactionCreate,
    InventoryTransactionResponse
)

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


def get_workspace(db: Session, current_user: User):
    """Get the current user's workspace."""
    workspace = db.query(Workspace).filter(Workspace.owner_id == current_user.id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace


@router.post("/items", response_model=InventoryItemResponse, status_code=status.HTTP_201_CREATED)
def create_inventory_item(
    item_data: InventoryItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new inventory item."""
    workspace = get_workspace(db, current_user)
    
    item = InventoryItem(
        workspace_id=workspace.id,
        name=item_data.name,
        description=item_data.description,
        sku=item_data.sku,
        category=item_data.category,
        total_quantity=item_data.total_quantity or Decimal("0"),
        min_threshold=item_data.min_threshold,
        unit_cost=item_data.unit_cost,
        unit_price=item_data.unit_price,
        unit=item_data.unit
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/items", response_model=List[InventoryItemResponse])
def list_inventory_items(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all inventory items for the workspace."""
    workspace = get_workspace(db, current_user)
    return db.query(InventoryItem).filter(
        InventoryItem.workspace_id == workspace.id
    ).offset(skip).limit(limit).all()


@router.get("/items/low-stock", response_model=List[InventoryItemResponse])
def get_low_stock_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all low stock items."""
    workspace = get_workspace(db, current_user)
    items = db.query(InventoryItem).filter(
        InventoryItem.workspace_id == workspace.id,
        InventoryItem.min_threshold.isnot(None)
    ).all()
    
    return [item for item in items if item.is_low_stock]


@router.get("/items/{item_id}", response_model=InventoryItemResponse)
def get_inventory_item(
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific inventory item."""
    workspace = get_workspace(db, current_user)
    item = db.query(InventoryItem).filter(
        InventoryItem.id == item_id,
        InventoryItem.workspace_id == workspace.id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return item


@router.patch("/items/{item_id}", response_model=InventoryItemResponse)
def update_inventory_item(
    item_id: UUID,
    item_data: InventoryItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an inventory item."""
    workspace = get_workspace(db, current_user)
    item = db.query(InventoryItem).filter(
        InventoryItem.id == item_id,
        InventoryItem.workspace_id == workspace.id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    for field, value in item_data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    
    db.commit()
    db.refresh(item)
    return item


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory_item(
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an inventory item."""
    workspace = get_workspace(db, current_user)
    item = db.query(InventoryItem).filter(
        InventoryItem.id == item_id,
        InventoryItem.workspace_id == workspace.id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    db.delete(item)
    db.commit()


@router.post("/transactions", response_model=InventoryTransactionResponse, status_code=status.HTTP_201_CREATED)
def create_inventory_transaction(
    transaction_data: InventoryTransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create an inventory transaction (purchase, use, adjustment)."""
    workspace = get_workspace(db, current_user)
    
    # Verify item exists
    item = db.query(InventoryItem).filter(
        InventoryItem.id == transaction_data.item_id,
        InventoryItem.workspace_id == workspace.id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    # Update item quantity based on transaction type
    qty = transaction_data.quantity
    if transaction_data.transaction_type in [InventoryTransactionType.PURCHASE, InventoryTransactionType.RETURN]:
        item.total_quantity = float(item.total_quantity or 0) + float(qty)
    elif transaction_data.transaction_type == InventoryTransactionType.USE:
        available = item.available_quantity
        if float(qty) > available:
            raise HTTPException(status_code=400, detail="Insufficient quantity available")
        item.total_quantity = float(item.total_quantity or 0) - float(qty)
    elif transaction_data.transaction_type == InventoryTransactionType.ADJUSTMENT:
        item.total_quantity = float(qty)
    
    # Create transaction record
    transaction = InventoryTransaction(
        workspace_id=workspace.id,
        item_id=transaction_data.item_id,
        transaction_type=transaction_data.transaction_type,
        quantity=transaction_data.quantity,
        job_id=transaction_data.job_id,
        booking_id=transaction_data.booking_id,
        notes=transaction_data.notes,
        created_by_id=current_user.id
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction

"""
Automation Router - API endpoints for automation management
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.models.automation import (
    AutomationLog, EmailTemplate, SMSTemplate, AutomationRule, ScheduledTask,
    EventType, AutomationStatus
)
from app.core.security import get_current_user, require_owner

router = APIRouter(prefix="/api/automation", tags=["automation"])


# ==================== SCHEMAS ====================

class EmailTemplateCreate(BaseModel):
    name: str
    slug: str
    subject: str
    body_html: Optional[str] = None
    body_text: Optional[str] = None
    variables: Optional[str] = None  # JSON string
    is_active: bool = True


class EmailTemplateResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    subject: str
    body_html: Optional[str]
    body_text: Optional[str]
    variables: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class SMSTemplateCreate(BaseModel):
    name: str
    slug: str
    body: str
    variables: Optional[str] = None
    is_active: bool = True


class SMSTemplateResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    body: str
    variables: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AutomationRuleCreate(BaseModel):
    name: str
    slug: str
    event_type: str
    action_type: str
    action_config: Optional[str] = None
    schedule_type: Optional[str] = "immediate"
    schedule_config: Optional[str] = None
    conditions: Optional[str] = None
    is_active: bool = True
    priority: int = 0


class AutomationRuleResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    event_type: str
    action_type: str
    action_config: Optional[str]
    schedule_type: Optional[str]
    conditions: Optional[str]
    is_active: bool
    priority: int
    created_at: datetime

    class Config:
        from_attributes = True


class AutomationLogResponse(BaseModel):
    id: UUID
    event_type: str
    entity_type: str
    entity_id: UUID
    action: str
    status: str
    error_message: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    duration_ms: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class ScheduledTaskResponse(BaseModel):
    id: UUID
    name: str
    task_type: str
    entity_type: str
    entity_id: UUID
    scheduled_at: datetime
    executed_at: Optional[datetime]
    status: str
    error_message: Optional[str]
    retry_count: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== HELPERS ====================

def get_workspace(db: Session, current_user: User) -> Workspace:
    """Get the current user's workspace."""
    workspace = db.query(Workspace).filter(Workspace.owner_id == current_user.id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace


# ==================== EMAIL TEMPLATES ====================

@router.post("/email-templates", response_model=EmailTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_email_template(
    template_data: EmailTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner)
):
    """Create a new email template."""
    workspace = get_workspace(db, current_user)

    # Check for duplicate slug
    existing = db.query(EmailTemplate).filter(
        EmailTemplate.workspace_id == workspace.id,
        EmailTemplate.slug == template_data.slug
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Template with this slug already exists")

    template = EmailTemplate(
        workspace_id=workspace.id,
        **template_data.dict()
    )
    db.add(template)
    db.commit()
    db.refresh(template)

    return template


@router.get("/email-templates", response_model=List[EmailTemplateResponse])
def list_email_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner)
):
    """List all email templates for the workspace."""
    workspace = get_workspace(db, current_user)

    templates = db.query(EmailTemplate).filter(
        EmailTemplate.workspace_id == workspace.id
    ).all()

    return templates


@router.get("/email-templates/{template_id}", response_model=EmailTemplateResponse)
def get_email_template(
    template_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner)
):
    """Get a specific email template."""
    workspace = get_workspace(db, current_user)

    template = db.query(EmailTemplate).filter(
        EmailTemplate.id == template_id,
        EmailTemplate.workspace_id == workspace.id
    ).first()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    return template


@router.delete("/email-templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_email_template(
    template_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner)
):
    """Delete an email template."""
    workspace = get_workspace(db, current_user)

    template = db.query(EmailTemplate).filter(
        EmailTemplate.id == template_id,
        EmailTemplate.workspace_id == workspace.id
    ).first()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    db.delete(template)
    db.commit()


# ==================== SMS TEMPLATES ====================

@router.post("/sms-templates", response_model=SMSTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_sms_template(
    template_data: SMSTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner)
):
    """Create a new SMS template."""
    workspace = get_workspace(db, current_user)

    template = SMSTemplate(
        workspace_id=workspace.id,
        **template_data.dict()
    )
    db.add(template)
    db.commit()
    db.refresh(template)

    return template


@router.get("/sms-templates", response_model=List[SMSTemplateResponse])
def list_sms_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner)
):
    """List all SMS templates for the workspace."""
    workspace = get_workspace(db, current_user)

    templates = db.query(SMSTemplate).filter(
        SMSTemplate.workspace_id == workspace.id
    ).all()

    return templates


@router.delete("/sms-templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sms_template(
    template_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner)
):
    """Delete an SMS template."""
    workspace = get_workspace(db, current_user)

    template = db.query(SMSTemplate).filter(
        SMSTemplate.id == template_id,
        SMSTemplate.workspace_id == workspace.id
    ).first()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    db.delete(template)
    db.commit()


# ==================== AUTOMATION RULES ====================

@router.post("/rules", response_model=AutomationRuleResponse, status_code=status.HTTP_201_CREATED)
def create_automation_rule(
    rule_data: AutomationRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner)
):
    """Create a new automation rule."""
    workspace = get_workspace(db, current_user)

    # Validate event_type
    try:
        event_type = EventType(rule_data.event_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid event_type: {rule_data.event_type}")

    rule = AutomationRule(
        workspace_id=workspace.id,
        event_type=event_type,
        **rule_data.dict(exclude={"event_type"})
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)

    return rule


@router.get("/rules", response_model=List[AutomationRuleResponse])
def list_automation_rules(
    event_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner)
):
    """List all automation rules for the workspace."""
    workspace = get_workspace(db, current_user)

    query = db.query(AutomationRule).filter(
        AutomationRule.workspace_id == workspace.id
    )

    if event_type:
        try:
            event = EventType(event_type)
            query = query.filter(AutomationRule.event_type == event)
        except ValueError:
            pass

    rules = query.order_by(AutomationRule.priority).all()

    return rules


@router.patch("/rules/{rule_id}", response_model=AutomationRuleResponse)
def update_automation_rule(
    rule_id: UUID,
    rule_data: AutomationRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner)
):
    """Update an automation rule."""
    workspace = get_workspace(db, current_user)

    rule = db.query(AutomationRule).filter(
        AutomationRule.id == rule_id,
        AutomationRule.workspace_id == workspace.id
    ).first()

    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    # Update fields
    for key, value in rule_data.dict(exclude_unset=True).items():
        setattr(rule, key, value)

    db.commit()
    db.refresh(rule)

    return rule


@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_automation_rule(
    rule_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner)
):
    """Delete an automation rule."""
    workspace = get_workspace(db, current_user)

    rule = db.query(AutomationRule).filter(
        AutomationRule.id == rule_id,
        AutomationRule.workspace_id == workspace.id
    ).first()

    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    db.delete(rule)
    db.commit()


# ==================== AUTOMATION LOGS ====================

@router.get("/logs", response_model=List[AutomationLogResponse])
def list_automation_logs(
    event_type: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner)
):
    """List automation logs for the workspace."""
    workspace = get_workspace(db, current_user)

    query = db.query(AutomationLog).filter(
        AutomationLog.workspace_id == workspace.id
    )

    if event_type:
        try:
            event = EventType(event_type)
            query = query.filter(AutomationLog.event_type == event)
        except ValueError:
            pass

    if status:
        try:
            stat = AutomationStatus(status)
            query = query.filter(AutomationLog.status == stat)
        except ValueError:
            pass

    logs = query.order_by(AutomationLog.created_at.desc()).limit(limit).all()

    return logs


# ==================== SCHEDULED TASKS ====================

@router.get("/scheduled-tasks", response_model=List[ScheduledTaskResponse])
def list_scheduled_tasks(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner)
):
    """List scheduled tasks for the workspace."""
    workspace = get_workspace(db, current_user)

    query = db.query(ScheduledTask).filter(
        ScheduledTask.workspace_id == workspace.id
    )

    if status:
        query = query.filter(ScheduledTask.status == status)

    tasks = query.order_by(ScheduledTask.scheduled_at).all()

    return tasks


@router.delete("/scheduled-tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_scheduled_task(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner)
):
    """Cancel a scheduled task."""
    workspace = get_workspace(db, current_user)

    task = db.query(ScheduledTask).filter(
        ScheduledTask.id == task_id,
        ScheduledTask.workspace_id == workspace.id,
        ScheduledTask.status == "pending"
    ).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found or already executed")

    task.status = "cancelled"
    db.commit()

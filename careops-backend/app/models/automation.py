"""
Automation Models - Event System, Templates, and Logging
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Integer, Index, Enum as SQLEnum, Boolean, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class EventType(str, enum.Enum):
    """Types of events that can trigger automation."""
    CONTACT_CREATED = "contact_created"
    BOOKING_CREATED = "booking_created"
    BOOKING_COMPLETED = "booking_completed"
    BOOKING_REMINDER = "booking_reminder"
    FORM_COMPLETED = "form_completed"
    FORM_PENDING = "form_pending"
    FORM_OVERDUE = "form_overdue"
    INVENTORY_LOW = "inventory_low"
    MESSAGE_RECEIVED = "message_received"
    STAFF_REPLY = "staff_reply"


class AutomationStatus(str, enum.Enum):
    """Status of automation execution."""
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    SKIPPED = "skipped"


class AutomationLog(Base):
    """Log of automation executions for audit trail."""
    __tablename__ = "automation_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)

    # Event information
    event_type = Column(SQLEnum(EventType), nullable=False)
    entity_type = Column(String(50), nullable=False)  # contact, booking, form, inventory
    entity_id = Column(UUID(as_uuid=True), nullable=False)

    # Action details
    action = Column(String(255), nullable=False)  # send_welcome_message, send_booking_confirmation, etc.
    status = Column(SQLEnum(AutomationStatus), default=AutomationStatus.PENDING, nullable=False)

    # Error details
    error_message = Column(Text, nullable=True)
    error_details = Column(Text, nullable=True)  # JSON string for detailed error info

    # Timing
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    duration_ms = Column(Integer, nullable=True)

    # Additional context
    extra_metadata = Column("metadata", Text, nullable=True)  # JSON string for additional context

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("ix_automation_logs_workspace_event", "workspace_id", "event_type"),
        Index("ix_automation_logs_workspace_status", "workspace_id", "status"),
        Index("ix_automation_logs_entity", "entity_type", "entity_id"),
        Index("ix_automation_logs_created", "created_at"),
    )


class EmailTemplate(Base):
    """Email templates for automated messages."""
    __tablename__ = "email_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)

    # Template details
    name = Column(String(255), nullable=False)
    slug = Column(String(100), nullable=False)  # welcome, booking_confirmation, booking_reminder, etc.

    # Content
    subject = Column(String(500), nullable=False)
    body_html = Column(Text, nullable=True)
    body_text = Column(Text, nullable=True)

    # Variables support (JSON string)
    variables = Column(Text, nullable=True)  # JSON array of variable names

    # Status
    is_active = Column(Boolean, default=True, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint('workspace_id', 'slug', name='uq_email_templates_workspace_slug'),
        Index("ix_email_templates_workspace", "workspace_id"),
        Index("ix_email_templates_slug", "slug"),
    )


class SMSTemplate(Base):
    """SMS templates for automated messages."""
    __tablename__ = "sms_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)

    # Template details
    name = Column(String(255), nullable=False)
    slug = Column(String(100), nullable=False)  # welcome, booking_confirmation, booking_reminder, etc.

    # Content
    body = Column(String(500), nullable=False)  # SMS character limit

    # Variables support (JSON string)
    variables = Column(Text, nullable=True)  # JSON array of variable names

    # Status
    is_active = Column(Boolean, default=True, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("ix_sms_templates_workspace", "workspace_id"),
        Index("ix_sms_templates_slug", "slug"),
    )


class AutomationRule(Base):
    """Automation rules configuration."""
    __tablename__ = "automation_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)

    # Rule details
    name = Column(String(255), nullable=False)
    slug = Column(String(100), nullable=False)  # unique identifier

    # Event trigger
    event_type = Column(SQLEnum(EventType), nullable=False)

    # Action configuration
    action_type = Column(String(50), nullable=False)  # send_email, send_sms, create_task, etc.
    action_config = Column(Text, nullable=True)  # JSON string with action-specific config

    # Schedule (for time-based triggers like reminders)
    schedule_type = Column(String(50), nullable=True)  # immediate, scheduled
    schedule_config = Column(Text, nullable=True)  # JSON string with schedule config

    # Conditions
    conditions = Column(Text, nullable=True)  # JSON string with conditions

    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    priority = Column(Integer, default=0, nullable=False)  # Lower = higher priority

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("ix_automation_rules_workspace_event", "workspace_id", "event_type"),
        Index("ix_automation_rules_active", "is_active"),
    )


class ScheduledTask(Base):
    """Scheduled tasks for time-based automation (e.g., reminders)."""
    __tablename__ = "scheduled_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)

    # Task details
    name = Column(String(255), nullable=False)
    task_type = Column(String(50), nullable=False)  # booking_reminder, form_reminder

    # Entity reference
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=False)

    # Schedule
    scheduled_at = Column(DateTime, nullable=False)
    executed_at = Column(DateTime, nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)

    # Status
    status = Column(String(50), default="pending", nullable=False)  # pending, running, completed, failed
    error_message = Column(Text, nullable=True)

    # Result
    result = Column(Text, nullable=True)  # JSON string with execution result

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("ix_scheduled_tasks_workspace", "workspace_id"),
        Index("ix_scheduled_tasks_status", "status"),
        Index("ix_scheduled_tasks_scheduled_at", "scheduled_at"),
    )

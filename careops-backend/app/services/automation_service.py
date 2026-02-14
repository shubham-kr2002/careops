"""
Automation Service - Event System, Templates, and Automation Logic
"""
import json
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.automation import (
    EventType, AutomationStatus, AutomationLog, EmailTemplate, SMSTemplate,
    AutomationRule, ScheduledTask
)
from app.models.contact import Contact
from app.models.booking import Booking
from app.models.form import BookingForm
from app.models.conversation import Conversation, Message, MessageType, MessageDirection
from app.models.inventory import InventoryItem
from app.models.workspace import Workspace

logger = logging.getLogger(__name__)


class AutomationService:
    """Service for handling automation events, rules, and actions."""

    def __init__(self, db: Session):
        self.db = db

    # ==================== EVENT HANDLING ====================

    async def trigger_event(
        self,
        event_type: EventType,
        entity_type: str,
        entity_id: UUID,
        workspace_id: UUID,
        metadata: Optional[Dict[str, Any]] = None
    ) -> List[AutomationLog]:
        """
        Trigger an automation event and execute matching rules.
        Returns list of automation logs.
        """
        logs = []

        # Get active automation rules for this event type
        rules = self.db.query(AutomationRule).filter(
            AutomationRule.workspace_id == workspace_id,
            AutomationRule.event_type == event_type,
            AutomationRule.is_active == True
        ).order_by(AutomationRule.priority).all()

        for rule in rules:
            log = await self._execute_rule(rule, entity_type, entity_id, metadata)
            if log:
                logs.append(log)

        return logs

    async def _execute_rule(
        self,
        rule: AutomationRule,
        entity_type: str,
        entity_id: UUID,
        metadata: Optional[Dict[str, Any]]
    ) -> Optional[AutomationLog]:
        """Execute a single automation rule."""
        started_at = datetime.utcnow()

        # Create log entry
        log = AutomationLog(
            workspace_id=rule.workspace_id,
            event_type=rule.event_type,
            entity_type=entity_type,
            entity_id=entity_id,
            action=f"{rule.action_type}:{rule.slug}",
            status=AutomationStatus.RUNNING,
            started_at=started_at,
            extra_metadata=json.dumps(metadata) if metadata else None
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)

        try:
            # Execute the action
            await self._execute_action(rule, entity_type, entity_id, metadata)

            # Update log on success
            log.status = AutomationStatus.SUCCESS
            log.completed_at = datetime.utcnow()
            log.duration_ms = int((datetime.utcnow() - started_at).total_seconds() * 1000)

        except Exception as e:
            logger.error(f"Automation rule {rule.slug} failed: {str(e)}")
            log.status = AutomationStatus.FAILED
            log.error_message = str(e)
            log.completed_at = datetime.utcnow()
            log.duration_ms = int((datetime.utcnow() - started_at).total_seconds() * 1000)

        self.db.commit()
        return log

    async def _execute_action(
        self,
        rule: AutomationRule,
        entity_type: str,
        entity_id: UUID,
        metadata: Optional[Dict[str, Any]]
    ):
        """Execute the specific action configured in the rule."""
        action_type = rule.action_type

        if action_type == "send_email":
            await self._action_send_email(rule, entity_type, entity_id)
        elif action_type == "send_sms":
            await self._action_send_sms(rule, entity_type, entity_id)
        elif action_type == "send_welcome_message":
            await self._action_send_welcome_message(entity_type, entity_id)
        elif action_type == "send_booking_confirmation":
            await self._action_send_booking_confirmation(entity_id)
        elif action_type == "schedule_booking_reminder":
            await self._action_schedule_booking_reminder(entity_id)
        elif action_type == "send_form_reminder":
            await self._action_send_form_reminder(entity_id)
        elif action_type == "notify_low_inventory":
            await self._action_notify_low_inventory(entity_id)
        else:
            logger.warning(f"Unknown action type: {action_type}")

    # ==================== ACTION HANDLERS ====================

    async def _action_send_email(
        self,
        rule: AutomationRule,
        entity_type: str,
        entity_id: UUID
    ):
        """Send an email using configured template."""
        action_config = json.loads(rule.action_config) if rule.action_config else {}
        template_id = action_config.get("template_id")
        to_field = action_config.get("to_field", "email")

        if not template_id:
            raise ValueError("No template_id in action_config")

        # Get template
        template = self.db.query(EmailTemplate).filter(
            EmailTemplate.id == UUID(template_id)
        ).first()

        if not template or not template.is_active:
            raise ValueError(f"Email template {template_id} not found or inactive")

        # Get entity (contact)
        entity = self._get_entity(entity_type, entity_id)
        if not entity:
            raise ValueError(f"Entity {entity_type}:{entity_id} not found")

        # Render template with variables
        to_email = getattr(entity, to_field, None)
        if not to_email:
            raise ValueError(f"No {to_field} on entity")

        subject = self._render_template(template.subject, entity, {})
        body = self._render_template(template.body_text or "", entity, {})

        # TODO: Actually send email via integration
        logger.info(f"Would send email to {to_email}: {subject}")

    async def _action_send_sms(
        self,
        rule: AutomationRule,
        entity_type: str,
        entity_id: UUID
    ):
        """Send an SMS using configured template."""
        action_config = json.loads(rule.action_config) if rule.action_config else {}
        template_id = action_config.get("template_id")
        to_field = action_config.get("to_field", "phone")

        if not template_id:
            raise ValueError("No template_id in action_config")

        # Get template
        template = self.db.query(SMSTemplate).filter(
            SMSTemplate.id == UUID(template_id)
        ).first()

        if not template or not template.is_active:
            raise ValueError(f"SMS template {template_id} not found or inactive")

        # Get entity (contact)
        entity = self._get_entity(entity_type, entity_id)
        if not entity:
            raise ValueError(f"Entity {entity_type}:{entity_id} not found")

        # Render template
        to_phone = getattr(entity, to_field, None)
        if not to_phone:
            raise ValueError(f"No {to_field} on entity")

        body = self._render_template(template.body, entity, {})

        # TODO: Actually send SMS via integration
        logger.info(f"Would send SMS to {to_phone}: {body}")

    async def _action_send_welcome_message(
        self,
        entity_type: str,
        entity_id: UUID
    ):
        """Send a welcome message to a new contact."""
        if entity_type != "contact":
            return

        contact = self.db.query(Contact).filter(Contact.id == entity_id).first()
        if not contact:
            return

        # Find or create conversation
        conversation = self.db.query(Conversation).filter(
            Conversation.contact_id == contact.id,
            Conversation.workspace_id == contact.workspace_id
        ).first()

        if not conversation:
            conversation = Conversation(
                contact_id=contact.id,
                workspace_id=contact.workspace_id,
                status="active"
            )
            self.db.add(conversation)
            self.db.commit()
            self.db.refresh(conversation)

        # Add welcome message
        message = Message(
            conversation_id=conversation.id,
            type=MessageType.AUTO,
            direction=MessageDirection.OUTBOUND,
            content=f"Hi {contact.name}! Thank you for contacting us. We'll be in touch soon!"
        )
        self.db.add(message)
        self.db.commit()

    async def _action_send_booking_confirmation(self, booking_id: UUID):
        """Send booking confirmation message."""
        booking = self.db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            return

        contact = booking.contact
        booking_type = booking.booking_type

        # Find or create conversation
        conversation = self.db.query(Conversation).filter(
            Conversation.contact_id == contact.id,
            Conversation.workspace_id == contact.workspace_id
        ).first()

        if not conversation:
            conversation = Conversation(
                contact_id=contact.id,
                workspace_id=contact.workspace_id,
                status="active"
            )
            self.db.add(conversation)
            self.db.commit()
            self.db.refresh(conversation)

        # Send confirmation
        message_content = f"Your booking for {booking_type.name} on {booking.scheduled_at.strftime('%B %d at %I:%M %p')} is confirmed!"
        if booking.location:
            message_content += f" Location: {booking.location}"
        if booking.is_virtual:
            message_content += f" Virtual meeting link: {booking.meeting_link}"

        message = Message(
            conversation_id=conversation.id,
            type=MessageType.AUTO,
            direction=MessageDirection.OUTBOUND,
            content=message_content
        )
        self.db.add(message)
        self.db.commit()

    async def _action_schedule_booking_reminder(self, booking_id: UUID):
        """Schedule a booking reminder task."""
        booking = self.db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            return

        # Schedule reminder 24 hours before booking
        reminder_time = booking.scheduled_at - timedelta(hours=24)
        if reminder_time <= datetime.utcnow():
            return  # Too late to schedule

        # Check if task already exists
        existing = self.db.query(ScheduledTask).filter(
            ScheduledTask.entity_id == booking_id,
            ScheduledTask.task_type == "booking_reminder",
            ScheduledTask.status == "pending"
        ).first()

        if existing:
            return

        # Create scheduled task
        task = ScheduledTask(
            workspace_id=booking.workspace_id,
            name=f"Booking Reminder: {booking.booking_type.name}",
            task_type="booking_reminder",
            entity_type="booking",
            entity_id=booking_id,
            scheduled_at=reminder_time,
            status="pending"
        )
        self.db.add(task)
        self.db.commit()

    async def _action_send_form_reminder(self, booking_form_id: UUID):
        """Send a reminder for pending form completion."""
        booking_form = self.db.query(BookingForm).filter(BookingForm.id == booking_form_id).first()
        if not booking_form:
            return

        booking = booking_form.booking
        contact = booking.contact

        # Find conversation
        conversation = self.db.query(Conversation).filter(
            Conversation.contact_id == contact.id,
            Conversation.workspace_id == contact.workspace_id
        ).first()

        if not conversation:
            return

        # Send reminder message
        message_content = f"Reminder: Please complete your form for your upcoming appointment on {booking.scheduled_at.strftime('%B %d')}. This helps us prepare better for your visit."

        message = Message(
            conversation_id=conversation.id,
            type=MessageType.AUTO,
            direction=MessageDirection.OUTBOUND,
            content=message_content
        )
        self.db.add(message)
        self.db.commit()

    async def _action_send_booking_reminder(self, booking_id: UUID):
        """Send a reminder for an upcoming booking."""
        booking = self.db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            return

        contact = booking.contact
        if not contact:
            return

        # Find conversation
        conversation = self.db.query(Conversation).filter(
            Conversation.contact_id == contact.id,
            Conversation.workspace_id == contact.workspace_id
        ).first()

        if not conversation:
            return

        booking_type = booking.booking_type
        message_content = f"Reminder: Your appointment for {booking_type.name if booking_type else 'your service'} is coming up on {booking.scheduled_at.strftime('%B %d at %I:%M %p')}."
        if booking.location:
            message_content += f" Location: {booking.location}"

        message = Message(
            conversation_id=conversation.id,
            type=MessageType.AUTO,
            direction=MessageDirection.OUTBOUND,
            content=message_content
        )
        self.db.add(message)
        self.db.commit()

    async def _action_notify_low_inventory(self, item_id: UUID):
        """Send notification about low inventory."""
        item = self.db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
        if not item:
            return

        # TODO: Create alert in dashboard
        logger.warning(f"LOW INVENTORY: {item.name} - {item.available_quantity} {item.unit} available (threshold: {item.min_threshold})")

    # ==================== TEMPLATE HELPERS ====================

    def _render_template(
        self,
        template: str,
        entity: Any,
        extra_vars: Dict[str, Any]
    ) -> str:
        """Render a template with entity variables."""
        variables = {
            "name": getattr(entity, "name", ""),
            "email": getattr(entity, "email", ""),
            "phone": getattr(entity, "phone", ""),
        }

        # Add entity-specific variables
        if hasattr(entity, "booking_type"):
            variables["service"] = entity.booking_type.name
            variables["scheduled_at"] = entity.scheduled_at.strftime("%B %d at %I:%M %p") if entity.scheduled_at else ""
        elif hasattr(entity, "booking"):
            variables["service"] = entity.booking.booking_type.name if entity.booking.booking_type else ""
            variables["scheduled_at"] = entity.booking.scheduled_at.strftime("%B %d at %I:%M %p") if entity.booking.scheduled_at else ""

        variables.update(extra_vars)

        # Simple template variable replacement
        result = template
        for key, value in variables.items():
            result = result.replace(f"{{{key}}}", str(value or ""))

        return result

    def _get_entity(self, entity_type: str, entity_id: UUID):
        """Get entity by type and ID."""
        if entity_type == "contact":
            return self.db.query(Contact).filter(Contact.id == entity_id).first()
        elif entity_type == "booking":
            return self.db.query(Booking).filter(Booking.id == entity_id).first()
        elif entity_type == "form" or entity_type == "booking_form":
            return self.db.query(BookingForm).filter(BookingForm.id == entity_id).first()
        elif entity_type == "inventory":
            return self.db.query(InventoryItem).filter(InventoryItem.id == entity_id).first()
        return None

    # ==================== EVENT TRIGGERS ====================

    async def on_contact_created(self, contact: Contact):
        """Handle contact created event."""
        await self.trigger_event(
            event_type=EventType.CONTACT_CREATED,
            entity_type="contact",
            entity_id=contact.id,
            workspace_id=contact.workspace_id,
            metadata={"contact_name": contact.name, "contact_email": contact.email}
        )

    async def on_booking_created(self, booking: Booking):
        """Handle booking created event."""
        await self.trigger_event(
            event_type=EventType.BOOKING_CREATED,
            entity_type="booking",
            entity_id=booking.id,
            workspace_id=booking.workspace_id,
            metadata={"booking_type": booking.booking_type.name if booking.booking_type else None}
        )

    async def on_booking_completed(self, booking: Booking):
        """Handle booking completed event."""
        await self.trigger_event(
            event_type=EventType.BOOKING_COMPLETED,
            entity_type="booking",
            entity_id=booking.id,
            workspace_id=booking.workspace_id,
            metadata={"booking_type": booking.booking_type.name if booking.booking_type else None}
        )

    async def on_form_pending(self, booking_form: BookingForm):
        """Handle form pending event."""
        await self.trigger_event(
            event_type=EventType.FORM_PENDING,
            entity_type="booking_form",
            entity_id=booking_form.id,
            workspace_id=booking_form.booking.workspace_id if booking_form.booking else None,
            metadata={"form_name": booking_form.form.name if booking_form.form else None}
        )

    async def on_inventory_low(self, item: InventoryItem):
        """Handle low inventory event."""
        if item.is_low_stock:
            await self.trigger_event(
                event_type=EventType.INVENTORY_LOW,
                entity_type="inventory",
                entity_id=item.id,
                workspace_id=item.workspace_id,
                metadata={
                    "item_name": item.name,
                    "available_quantity": item.available_quantity,
                    "threshold": item.min_threshold
                }
            )


# ==================== SCHEDULED TASKS ====================

async def process_scheduled_tasks(db: Session):
    """Process pending scheduled tasks (called by background worker)."""
    now = datetime.utcnow()

    pending_tasks = db.query(ScheduledTask).filter(
        ScheduledTask.status == "pending",
        ScheduledTask.scheduled_at <= now
    ).limit(100).all()

    service = AutomationService(db)

    for task in pending_tasks:
        task.status = "running"
        db.commit()

        try:
            if task.task_type == "booking_reminder":
                await service._action_send_booking_reminder(task.entity_id)
            elif task.task_type == "form_reminder":
                await service._action_send_form_reminder(task.entity_id)

            task.status = "completed"
            task.executed_at = datetime.utcnow()

        except Exception as e:
            logger.error(f"Scheduled task {task.id} failed: {str(e)}")
            task.status = "failed"
            task.error_message = str(e)

            # Retry logic
            if task.retry_count < 3:
                task.retry_count += 1
                task.status = "pending"
                task.scheduled_at = datetime.utcnow() + timedelta(minutes=5 * task.retry_count)

        db.commit()


# ==================== SEED DEFAULT AUTOMATION RULES ====================

def seed_default_automation_rules(db: Session, workspace_id: UUID):
    """Create default automation rules for a workspace."""

    # Contact created -> Welcome message
    contact_rule = AutomationRule(
        workspace_id=workspace_id,
        name="Send Welcome Message",
        slug="send_welcome_message",
        event_type=EventType.CONTACT_CREATED,
        action_type="send_welcome_message",
        schedule_type="immediate",
        is_active=True,
        priority=10
    )
    db.add(contact_rule)

    # Booking created -> Confirmation + Reminder
    booking_rule = AutomationRule(
        workspace_id=workspace_id,
        name="Booking Confirmation",
        slug="booking_confirmation",
        event_type=EventType.BOOKING_CREATED,
        action_type="send_booking_confirmation",
        schedule_type="immediate",
        is_active=True,
        priority=10
    )
    db.add(booking_rule)

    # Booking created -> Schedule reminder
    reminder_rule = AutomationRule(
        workspace_id=workspace_id,
        name="Schedule Booking Reminder",
        slug="schedule_booking_reminder",
        event_type=EventType.BOOKING_CREATED,
        action_type="schedule_booking_reminder",
        schedule_type="immediate",
        is_active=True,
        priority=20
    )
    db.add(reminder_rule)

    db.commit()


def seed_default_templates(db: Session, workspace_id: UUID):
    """Create default email and SMS templates for a workspace."""

    # Email templates
    email_templates = [
        {
            "name": "Welcome Email",
            "slug": "welcome",
            "subject": "Welcome to {business_name}!",
            "body_text": "Hi {name}! Thank you for contacting us. We'll be in touch soon."
        },
        {
            "name": "Booking Confirmation",
            "slug": "booking_confirmation",
            "subject": "Your Booking is Confirmed - {service}",
            "body_text": "Hi {name}! Your booking for {service} on {scheduled_at} is confirmed. We look forward to seeing you!"
        },
        {
            "name": "Booking Reminder",
            "slug": "booking_reminder",
            "subject": "Reminder: Your Appointment Tomorrow",
            "body_text": "Hi {name}! This is a reminder about your appointment for {service} tomorrow at {scheduled_at}."
        },
    ]

    for template_data in email_templates:
        existing = db.query(EmailTemplate).filter(
            EmailTemplate.workspace_id == workspace_id,
            EmailTemplate.slug == template_data["slug"]
        ).first()

        if not existing:
            template = EmailTemplate(
                workspace_id=workspace_id,
                **template_data,
                is_active=True
            )
            db.add(template)

    # SMS templates
    sms_templates = [
        {
            "name": "Welcome SMS",
            "slug": "welcome",
            "body": "Hi {name}! Thanks for contacting us. We'll be in touch soon!"
        },
        {
            "name": "Booking Confirmation",
            "slug": "booking_confirmation",
            "body": "Your booking for {service} on {scheduled_at} is confirmed!"
        },
        {
            "name": "Booking Reminder",
            "slug": "booking_reminder",
            "body": "Reminder: Your appointment is tomorrow at {scheduled_at}."
        },
    ]

    for template_data in sms_templates:
        existing = db.query(SMSTemplate).filter(
            SMSTemplate.workspace_id == workspace_id,
            SMSTemplate.slug == template_data["slug"]
        ).first()

        if not existing:
            template = SMSTemplate(
                workspace_id=workspace_id,
                **template_data,
                is_active=True
            )
            db.add(template)

    db.commit()

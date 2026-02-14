"""
Webhooks Router - handles incoming webhooks from WhatsApp, Slack, etc.
"""
from fastapi import APIRouter, Request, Response, HTTPException, Depends, Query
from sqlalchemy.orm import Session
import logging
import json
from datetime import datetime, timezone

from app.database import get_db
from app.models.contact import Contact
from app.models.conversation import Conversation, Message, ConversationStatus, MessageType, MessageDirection
from app.models.workspace import Workspace
from app.services.whatsapp_service import whatsapp_service
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/webhooks", tags=["webhooks"])


# ─── WhatsApp Webhook Verification ───────────────────────────────────────────
@router.get("/whatsapp")
async def verify_whatsapp_webhook(
    mode: str = Query("", alias="hub.mode"),
    token: str = Query("", alias="hub.verify_token"),
    challenge: str = Query("", alias="hub.challenge"),
):
    """Verify WhatsApp webhook subscription (hub.mode, hub.verify_token, hub.challenge)."""
    result = whatsapp_service.verify_webhook(mode, token, challenge)
    if result is not None:
        return Response(content=result, media_type="text/plain")
    raise HTTPException(status_code=403, detail="Verification failed")


# ─── WhatsApp Incoming Messages ──────────────────────────────────────────────
@router.post("/whatsapp")
async def handle_whatsapp_webhook(request: Request, db: Session = Depends(get_db)):
    """Process incoming WhatsApp messages."""
    try:
        body = await request.body()
        payload = json.loads(body)

        # Validate signature if configured
        signature = request.headers.get("x-hub-signature-256", "")
        if signature and not whatsapp_service.validate_signature(body, signature):
            raise HTTPException(status_code=403, detail="Invalid signature")

        parsed = whatsapp_service.parse_incoming_message(payload)
        if not parsed:
            # Status updates or other non-message events
            return {"status": "ok"}

        from_number = parsed["from_number"]
        message_text = parsed["text"]
        contact_name = parsed["contact_name"]

        if not message_text:
            return {"status": "ok"}

        # Find or create contact by phone number (scoped to workspace)
        # First try to find an existing contact with this phone
        contact = db.query(Contact).filter(
            Contact.phone == from_number
        ).first()

        workspace = None
        if contact:
            workspace = db.query(Workspace).filter(
                Workspace.id == contact.workspace_id
            ).first()
        else:
            # Find a default workspace to attach the contact
            workspace = db.query(Workspace).first()
            if workspace:
                contact = Contact(
                    workspace_id=workspace.id,
                    name=contact_name or f"WhatsApp {from_number}",
                    phone=from_number,
                    source="whatsapp",
                    segment="new",
                )
                db.add(contact)
                db.flush()

        if not workspace or not contact:
            logger.warning(f"No workspace found for WhatsApp message from {from_number}")
            return {"status": "ok"}

        # Find or create conversation
        conversation = db.query(Conversation).filter(
            Conversation.contact_id == contact.id,
            Conversation.workspace_id == workspace.id,
            Conversation.status == ConversationStatus.ACTIVE,
        ).first()

        if not conversation:
            conversation = Conversation(
                workspace_id=workspace.id,
                contact_id=contact.id,
                status=ConversationStatus.ACTIVE,
                last_message_at=datetime.now(timezone.utc),
            )
            db.add(conversation)
            db.flush()

        # Save incoming message
        incoming_msg = Message(
            conversation_id=conversation.id,
            type=MessageType.WHATSAPP,
            direction=MessageDirection.INBOUND,
            content=message_text,
        )
        db.add(incoming_msg)

        # Generate AI response
        try:
            ai_response = await ai_service.process_inquiry(message_text)
            response_text = ai_response.suggested_response or "Thank you for your message. Our team will get back to you shortly."
        except Exception:
            response_text = "Thank you for your message. Our team will get back to you shortly."

        # Save AI response as message
        ai_msg = Message(
            conversation_id=conversation.id,
            type=MessageType.AUTO,
            direction=MessageDirection.OUTBOUND,
            content=response_text,
        )
        db.add(ai_msg)

        # Update conversation last_message_at  
        conversation.last_message_at = datetime.now(timezone.utc)

        # Send reply via WhatsApp
        await whatsapp_service.send_message(from_number, response_text)

        # Update contact activity
        contact.last_activity_at = datetime.now(timezone.utc)
        db.commit()

        logger.info(f"WhatsApp message processed from {from_number}")
        return {"status": "ok"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"WhatsApp webhook error: {e}")
        db.rollback()
        return {"status": "error", "detail": str(e)}


# ─── Slack Events ────────────────────────────────────────────────────────────
@router.post("/slack/events")
async def handle_slack_events(request: Request):
    """Handle Slack Events API (challenge verification + events)."""
    try:
        payload = await request.json()

        # URL verification challenge
        if payload.get("type") == "url_verification":
            return {"challenge": payload.get("challenge")}

        event = payload.get("event", {})
        event_type = event.get("type")

        if event_type == "message" and not event.get("bot_id"):
            # Human message in a channel - log it
            logger.info(f"Slack message from {event.get('user')}: {event.get('text', '')[:100]}")

        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Slack event error: {e}")
        return {"status": "error"}


# ─── Slack Slash Commands ────────────────────────────────────────────────────
@router.post("/slack/commands")
async def handle_slack_command(request: Request, db: Session = Depends(get_db)):
    """Handle Slack slash commands (e.g., /careops status)."""
    try:
        form = await request.form()
        command = form.get("command", "")
        text = form.get("text", "")
        user_id = form.get("user_id", "")

        if command == "/careops":
            parts = text.strip().split(" ", 1)
            sub_command = parts[0] if parts else "help"

            if sub_command == "status":
                workspace = db.query(Workspace).first()
                if workspace:
                    booking_count = len(workspace.bookings) if hasattr(workspace, "bookings") else 0
                    contact_count = len(workspace.contacts) if hasattr(workspace, "contacts") else 0
                    return {
                        "response_type": "ephemeral",
                        "text": f"*CareOps Status*\nWorkspace: {workspace.name}\nBookings: {booking_count}\nContacts: {contact_count}",
                    }
                return {"response_type": "ephemeral", "text": "No workspace configured."}

            elif sub_command == "help":
                return {
                    "response_type": "ephemeral",
                    "text": "*CareOps Commands:*\n`/careops status` - View workspace status\n`/careops help` - Show this help",
                }
            else:
                return {
                    "response_type": "ephemeral",
                    "text": f"Unknown command: {sub_command}. Try `/careops help`.",
                }

        return {"response_type": "ephemeral", "text": "Unknown command."}
    except Exception as e:
        logger.error(f"Slack command error: {e}")
        return {"response_type": "ephemeral", "text": "An error occurred processing your command."}


# ─── Generic Webhook ─────────────────────────────────────────────────────────
@router.post("/generic/{integration_id}")
async def handle_generic_webhook(integration_id: str, request: Request, db: Session = Depends(get_db)):
    """Handle generic webhook payloads for custom integrations."""
    try:
        payload = await request.json()
        logger.info(f"Generic webhook received for integration {integration_id}: {json.dumps(payload)[:200]}")
        return {"status": "ok", "integration_id": integration_id, "received": True}
    except Exception as e:
        logger.error(f"Generic webhook error: {e}")
        return {"status": "error"}

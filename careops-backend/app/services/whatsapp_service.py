"""
WhatsApp Service - WhatsApp Business Cloud API integration
Handles sending/receiving messages via Meta Cloud API
"""
import os
import logging
import json
import hmac
import hashlib
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


class WhatsAppService:
    """WhatsApp Business Cloud API integration service."""

    def __init__(self):
        self.phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
        self.access_token = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
        self.verify_token = os.getenv("WHATSAPP_VERIFY_TOKEN", "careops_whatsapp_verify")
        self.api_version = "v18.0"
        self.base_url = f"https://graph.facebook.com/{self.api_version}"
        self.available = bool(self.phone_number_id and self.access_token)

        if self.available:
            logger.info("WhatsApp Service initialized")
        else:
            logger.warning("WhatsApp credentials not configured, service unavailable")

    def verify_webhook(self, mode: str, token: str, challenge: str) -> Optional[str]:
        """Verify webhook subscription from Meta."""
        if mode == "subscribe" and token == self.verify_token:
            logger.info("WhatsApp webhook verified")
            return challenge
        logger.warning("WhatsApp webhook verification failed")
        return None

    def validate_signature(self, payload: bytes, signature: str) -> bool:
        """Validate webhook signature (x-hub-signature-256)."""
        if not os.getenv("WHATSAPP_APP_SECRET"):
            return True  # Skip validation if no secret configured
        expected = hmac.new(
            os.getenv("WHATSAPP_APP_SECRET", "").encode(),
            payload,
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(f"sha256={expected}", signature)

    def parse_incoming_message(self, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Parse incoming webhook payload and extract message data."""
        try:
            entry = payload.get("entry", [{}])[0]
            changes = entry.get("changes", [{}])[0]
            value = changes.get("value", {})
            messages = value.get("messages", [])

            if not messages:
                return None

            msg = messages[0]
            contact_info = value.get("contacts", [{}])[0]

            return {
                "from_number": msg.get("from"),
                "message_id": msg.get("id"),
                "timestamp": msg.get("timestamp"),
                "type": msg.get("type", "text"),
                "text": msg.get("text", {}).get("body", "") if msg.get("type") == "text" else "",
                "contact_name": contact_info.get("profile", {}).get("name", ""),
            }
        except (IndexError, KeyError) as e:
            logger.error(f"Failed to parse WhatsApp message: {e}")
            return None

    async def send_message(self, to: str, text: str) -> Optional[str]:
        """Send a text message via WhatsApp Business API."""
        if not self.available:
            logger.warning("WhatsApp service not available")
            return None

        try:
            import httpx
            url = f"{self.base_url}/{self.phone_number_id}/messages"
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json",
            }
            payload = {
                "messaging_product": "whatsapp",
                "to": to,
                "type": "text",
                "text": {"body": text},
            }

            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=headers)
                if response.status_code == 200:
                    result = response.json()
                    message_id = result.get("messages", [{}])[0].get("id")
                    logger.info(f"WhatsApp message sent: {message_id}")
                    return message_id
                else:
                    logger.error(f"WhatsApp send failed: {response.status_code} {response.text}")
                    return None
        except Exception as e:
            logger.error(f"WhatsApp send error: {e}")
            return None

    async def send_template(self, to: str, template_name: str, language: str = "en_US", components: list = None) -> Optional[str]:
        """Send a template message via WhatsApp Business API."""
        if not self.available:
            return None

        try:
            import httpx
            url = f"{self.base_url}/{self.phone_number_id}/messages"
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json",
            }
            payload = {
                "messaging_product": "whatsapp",
                "to": to,
                "type": "template",
                "template": {
                    "name": template_name,
                    "language": {"code": language},
                },
            }
            if components:
                payload["template"]["components"] = components

            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=headers)
                if response.status_code == 200:
                    return response.json().get("messages", [{}])[0].get("id")
                logger.error(f"WhatsApp template send failed: {response.status_code}")
                return None
        except Exception as e:
            logger.error(f"WhatsApp template error: {e}")
            return None


# Singleton instance
whatsapp_service = WhatsAppService()

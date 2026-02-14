"""
Slack Service - Slack Web API integration
Handles sending notifications and messages to Slack channels/users
"""
import os
import logging
import hmac
import hashlib
import time
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)


class SlackService:
    """Slack Web API integration service."""

    def __init__(self):
        self.bot_token = os.getenv("SLACK_BOT_TOKEN", "")
        self.signing_secret = os.getenv("SLACK_SIGNING_SECRET", "")
        self.default_channel = os.getenv("SLACK_DEFAULT_CHANNEL", "#careops-notifications")
        self.base_url = "https://slack.com/api"
        self.available = bool(self.bot_token)

        if self.available:
            logger.info("Slack Service initialized")
        else:
            logger.warning("Slack credentials not configured, service unavailable")

    def verify_request(self, timestamp: str, body: str, signature: str) -> bool:
        """Verify Slack request signature."""
        if not self.signing_secret:
            return True

        # Reject requests older than 5 minutes
        if abs(time.time() - int(timestamp)) > 300:
            return False

        sig_basestring = f"v0:{timestamp}:{body}"
        computed = "v0=" + hmac.new(
            self.signing_secret.encode(),
            sig_basestring.encode(),
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(computed, signature)

    async def send_message(self, channel: str, text: str, blocks: list = None) -> Optional[str]:
        """Send a message to a Slack channel."""
        if not self.available:
            logger.warning("Slack service not available")
            return None

        try:
            import httpx
            url = f"{self.base_url}/chat.postMessage"
            headers = {
                "Authorization": f"Bearer {self.bot_token}",
                "Content-Type": "application/json",
            }
            payload: Dict[str, Any] = {
                "channel": channel,
                "text": text,
            }
            if blocks:
                payload["blocks"] = blocks

            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=headers)
                data = response.json()
                if data.get("ok"):
                    logger.info(f"Slack message sent to {channel}: {data.get('ts')}")
                    return data.get("ts")
                else:
                    logger.error(f"Slack send failed: {data.get('error')}")
                    return None
        except Exception as e:
            logger.error(f"Slack send error: {e}")
            return None

    async def send_notification(
        self,
        title: str,
        message: str,
        level: str = "info",
        channel: str = None,
    ) -> Optional[str]:
        """Send a formatted notification to Slack."""
        color_map = {
            "info": "#36a64f",
            "warning": "#ff9900",
            "error": "#ff0000",
            "success": "#2eb886",
        }
        color = color_map.get(level, "#36a64f")
        target_channel = channel or self.default_channel

        blocks = [
            {
                "type": "header",
                "text": {"type": "plain_text", "text": f"CareOps: {title}", "emoji": True},
            },
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": message},
            },
            {
                "type": "context",
                "elements": [
                    {"type": "mrkdwn", "text": f"*Level:* {level.upper()} | *Source:* CareOps AI"}
                ],
            },
        ]

        return await self.send_message(target_channel, text=f"{title}: {message}", blocks=blocks)

    async def send_booking_notification(self, booking_data: Dict[str, Any], channel: str = None) -> Optional[str]:
        """Send a booking notification to Slack."""
        target_channel = channel or self.default_channel
        blocks = [
            {
                "type": "header",
                "text": {"type": "plain_text", "text": "New Booking", "emoji": True},
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*Client:*\n{booking_data.get('client_name', 'N/A')}"},
                    {"type": "mrkdwn", "text": f"*Service:*\n{booking_data.get('service', 'N/A')}"},
                    {"type": "mrkdwn", "text": f"*Date:*\n{booking_data.get('date', 'N/A')}"},
                    {"type": "mrkdwn", "text": f"*Status:*\n{booking_data.get('status', 'pending')}"},
                ],
            },
        ]
        return await self.send_message(
            target_channel,
            text=f"New booking from {booking_data.get('client_name', 'N/A')}",
            blocks=blocks,
        )

    async def send_maintenance_alert(self, equipment_data: Dict[str, Any], channel: str = None) -> Optional[str]:
        """Send a maintenance alert to Slack."""
        target_channel = channel or self.default_channel
        blocks = [
            {
                "type": "header",
                "text": {"type": "plain_text", "text": "Maintenance Alert", "emoji": True},
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*Equipment:*\n{equipment_data.get('name', 'N/A')}"},
                    {"type": "mrkdwn", "text": f"*Status:*\n{equipment_data.get('status', 'N/A')}"},
                    {"type": "mrkdwn", "text": f"*Risk:*\n{equipment_data.get('risk_level', 'N/A')}"},
                    {"type": "mrkdwn", "text": f"*Due:*\n{equipment_data.get('next_due', 'N/A')}"},
                ],
            },
        ]
        return await self.send_message(
            target_channel,
            text=f"Maintenance alert for {equipment_data.get('name', 'N/A')}",
            blocks=blocks,
        )

    async def list_channels(self) -> List[Dict[str, str]]:
        """List available Slack channels."""
        if not self.available:
            return []

        try:
            import httpx
            url = f"{self.base_url}/conversations.list"
            headers = {"Authorization": f"Bearer {self.bot_token}"}
            params = {"types": "public_channel,private_channel", "limit": 100}

            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers, params=params)
                data = response.json()
                if data.get("ok"):
                    return [
                        {"id": ch["id"], "name": ch["name"]}
                        for ch in data.get("channels", [])
                    ]
                return []
        except Exception as e:
            logger.error(f"Slack list channels error: {e}")
            return []


# Singleton instance
slack_service = SlackService()

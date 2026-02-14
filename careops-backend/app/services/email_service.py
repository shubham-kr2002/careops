"""
Email Service - Supports both SendGrid and Gmail API
"""
import os
import logging
import asyncio
from typing import Optional, Dict, Any
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import base64

logger = logging.getLogger(__name__)


class EmailService:
    """Email service supporting multiple providers."""

    def __init__(self):
        self.provider = os.getenv("EMAIL_PROVIDER", "sendgrid").lower()
        self._init_provider()

    def _init_provider(self):
        """Initialize the email provider."""
        if self.provider == "gmail":
            self._init_gmail()
        else:
            self._init_sendgrid()

    def _init_gmail(self):
        """Initialize Gmail API."""
        try:
            from google.oauth2.credentials import Credentials
            from googleapiclient.discovery import build
            
            self.credentials = Credentials(
                token=os.getenv("GMAIL_ACCESS_TOKEN"),
                refresh_token=os.getenv("GMAIL_REFRESH_TOKEN"),
                client_id=os.getenv("GMAIL_CLIENT_ID"),
                client_secret=os.getenv("GMAIL_CLIENT_SECRET"),
                scopes=["https://www.googleapis.com/auth/gmail.send"]
            )
            self.gmail_service = build("gmail", "v1", credentials=self.credentials)
            logger.info("Gmail API initialized successfully")
        except Exception as e:
            logger.warning(f"Failed to initialize Gmail API: {e}. Falling back to SendGrid.")
            self.provider = "sendgrid"
            self._init_sendgrid()

    def _init_sendgrid(self):
        """Initialize SendGrid."""
        try:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail
            
            self.sendgrid_api_key = os.getenv("SENDGRID_API_KEY", "")
            if self.sendgrid_api_key:
                self.sg = SendGridAPIClient(self.sendgrid_api_key)
                self.Mail = Mail
                logger.info("SendGrid initialized successfully")
            else:
                logger.warning("SendGrid API key not configured")
        except ImportError:
            logger.warning("SendGrid not installed")

    async def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        from_email: Optional[str] = None,
        html_body: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send an email using the configured provider.
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            body: Plain text body
            from_email: Sender email (optional, uses default if not provided)
            html_body: HTML body (optional)
            
        Returns:
            Dictionary with success status and details
        """
        if self.provider == "gmail":
            return await self._send_gmail(to_email, subject, body, from_email, html_body)
        else:
            return await self._send_sendgrid(to_email, subject, body, from_email, html_body)

    async def _send_gmail(
        self,
        to_email: str,
        subject: str,
        body: str,
        from_email: Optional[str] = None,
        html_body: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send email via Gmail API."""
        try:
            from googleapiclient.errors import HttpError
            
            if not from_email:
                from_email = os.getenv("GMAIL_EMAIL", "noreply@example.com")

            # Create message
            message = MIMEMultipart('alternative')
            message['To'] = to_email
            message['From'] = from_email
            message['Subject'] = subject

            # Attach plain text
            text_part = MIMEText(body, 'plain')
            message.attach(text_part)

            # Attach HTML if provided
            if html_body:
                html_part = MIMEText(html_body, 'html')
                message.attach(html_part)

            # Encode and send (run sync I/O in executor to avoid blocking event loop)
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
            
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                lambda: self.gmail_service.users().messages().send(
                    userId='me',
                    body={'raw': raw_message}
                ).execute()
            )

            logger.info(f"Gmail sent successfully to {to_email}: {result.get('id')}")
            return {
                "success": True,
                "provider": "gmail",
                "message_id": result.get('id'),
                "to": to_email
            }

        except HttpError as e:
            logger.error(f"Gmail API error: {e}")
            return {
                "success": False,
                "provider": "gmail",
                "error": str(e)
            }
        except Exception as e:
            logger.error(f"Failed to send Gmail: {e}")
            return {
                "success": False,
                "provider": "gmail",
                "error": str(e)
            }

    async def _send_sendgrid(
        self,
        to_email: str,
        subject: str,
        body: str,
        from_email: Optional[str] = None,
        html_body: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send email via SendGrid."""
        try:
            if not hasattr(self, 'sg') or not self.sendgrid_api_key:
                return {
                    "success": False,
                    "provider": "sendgrid",
                    "error": "SendGrid not configured"
                }

            if not from_email:
                from_email = os.getenv("SENDGRID_FROM_EMAIL", "noreply@example.com")

            message = self.Mail(
                from_email=from_email,
                to_emails=to_email,
                subject=subject,
                html_content=html_body or body,
                plain_text_content=body
            )

            # Run sync I/O in executor to avoid blocking event loop
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, self.sg.send, message)
            
            logger.info(f"SendGrid email sent successfully to {to_email}")
            return {
                "success": True,
                "provider": "sendgrid",
                "message_id": response.headers.get('x-message-id'),
                "status_code": response.status_code,
                "to": to_email
            }

        except Exception as e:
            logger.error(f"Failed to send SendGrid email: {e}")
            return {
                "success": False,
                "provider": "sendgrid",
                "error": str(e)
            }

    def get_provider_info(self) -> Dict[str, Any]:
        """Get information about the configured email provider."""
        return {
            "provider": self.provider,
            "configured": hasattr(self, 'sg') and self.sendgrid_api_key if self.provider == "sendgrid" else hasattr(self, 'gmail_service')
        }


# Singleton instance
email_service = EmailService()

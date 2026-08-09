"""Africa's Talking SMS client + OTP delivery.

Thin ``requests`` wrapper mirroring payments.paystack_client (no vendor SDK).
When no API key is configured the OTP is logged to the console instead of sent,
so the phone-auth flow is fully testable locally with zero cost/credentials —
the same "best-effort external integration" posture the Paystack code uses.
"""

from __future__ import annotations

import logging
from typing import Any

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class AfricasTalkingError(Exception):
    """Raised when Africa's Talking returns a non-success response."""

    def __init__(self, message: str, *, status_code: int | None = None, payload: Any = None):
        super().__init__(message)
        self.status_code = status_code
        self.payload = payload


class AfricasTalkingClient:
    """Minimal wrapper around the Africa's Talking SMS API."""

    LIVE_URL = "https://api.africastalking.com/version1/messaging"
    SANDBOX_URL = "https://api.sandbox.africastalking.com/version1/messaging"

    def __init__(
        self,
        username: str | None = None,
        api_key: str | None = None,
        sender_id: str | None = None,
        timeout: int = 30,
    ):
        self.username = username if username is not None else settings.AFRICASTALKING_USERNAME
        self.api_key = api_key if api_key is not None else settings.AFRICASTALKING_API_KEY
        self.sender_id = sender_id if sender_id is not None else settings.AFRICASTALKING_SENDER_ID
        self.timeout = timeout
        if not self.api_key:
            raise AfricasTalkingError("AFRICASTALKING_API_KEY is not configured.")

    @property
    def base_url(self) -> str:
        return self.SANDBOX_URL if self.username == "sandbox" else self.LIVE_URL

    def send_sms(self, to: str, message: str) -> dict:
        """Send one SMS. ``to`` should be E.164 (+254…)."""
        data = {"username": self.username, "to": to, "message": message}
        if self.sender_id:
            data["from"] = self.sender_id
        headers = {
            "apiKey": self.api_key,
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
        }
        try:
            response = requests.post(self.base_url, data=data, headers=headers, timeout=self.timeout)
        except requests.RequestException as exc:
            raise AfricasTalkingError(f"Africa's Talking request failed: {exc}") from exc

        try:
            payload = response.json()
        except ValueError:
            payload = {"raw": response.text}

        if not 200 <= response.status_code < 300:
            raise AfricasTalkingError(
                f"Africa's Talking HTTP {response.status_code}",
                status_code=response.status_code,
                payload=payload,
            )
        return payload if isinstance(payload, dict) else {"data": payload}


def deliver_otp(phone: str, code: str) -> bool:
    """Send the OTP SMS, or log it in dev.

    Returns True if an SMS was actually dispatched, False if it was only logged
    (no API key configured, or OTP_DEV_MODE on). Never raises on send failure —
    a dropped SMS must not 500 the auth request; the code stays valid to retry.
    """
    message = f"Your SalamaFarm verification code is {code}. It expires in 5 minutes."

    dev_mode = getattr(settings, "OTP_DEV_MODE", False)
    if dev_mode or not settings.AFRICASTALKING_API_KEY:
        logger.warning("[DEV OTP] SMS not sent — code for %s is %s", phone, code)
        return False

    try:
        AfricasTalkingClient().send_sms(phone, message)
    except AfricasTalkingError as exc:
        logger.error("OTP SMS to %s failed: %s", phone, exc)
        return False
    logger.info("OTP SMS dispatched to %s", phone)
    return True

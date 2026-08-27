"""Verify Google ID tokens for customer Sign-In."""

from __future__ import annotations

import logging

from django.conf import settings
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

logger = logging.getLogger(__name__)


class GoogleTokenError(Exception):
    """Raised when an ID token cannot be verified or is missing claims."""


def verify_google_id_token(raw_token: str) -> dict:
    """Validate a Google ID token and return claims (sub, email, name, …).

    Audience must match one of GOOGLE_OAUTH_CLIENT_IDS. In local/dev, if no
    client IDs are configured, verification fails with a clear message.
    """
    audiences = getattr(settings, "GOOGLE_OAUTH_CLIENT_IDS", None) or []
    if isinstance(audiences, str):
        audiences = [a.strip() for a in audiences.split(",") if a.strip()]
    if not audiences:
        raise GoogleTokenError(
            "Google Sign-In is not configured on the server (GOOGLE_OAUTH_CLIENT_IDS)."
        )

    last_error: Exception | None = None
    for audience in audiences:
        try:
            claims = id_token.verify_oauth2_token(
                raw_token,
                google_requests.Request(),
                audience,
                clock_skew_in_seconds=10,
            )
            break
        except ValueError as exc:
            last_error = exc
            claims = None
    else:
        logger.info("Google ID token verification failed: %s", last_error)
        raise GoogleTokenError("Invalid Google token.") from last_error

    if claims.get("iss") not in ("accounts.google.com", "https://accounts.google.com"):
        raise GoogleTokenError("Invalid Google token issuer.")

    sub = claims.get("sub")
    email = (claims.get("email") or "").strip().lower()
    if not sub or not email:
        raise GoogleTokenError("Google token missing email or subject.")
    if not claims.get("email_verified", False):
        raise GoogleTokenError("Google email is not verified.")

    return {
        "sub": sub,
        "email": email,
        "name": (claims.get("name") or "").strip(),
        "picture": claims.get("picture") or "",
    }

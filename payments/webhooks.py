"""Paystack HMAC helpers."""

from __future__ import annotations

import hashlib
import hmac


def compute_paystack_signature(raw_body: bytes, secret: str) -> str:
    """HMAC-SHA512 hex digest of the raw body using the Paystack secret key."""
    return hmac.new(
        secret.encode("utf-8"),
        raw_body,
        hashlib.sha512,
    ).hexdigest()


def verify_paystack_signature(raw_body: bytes, signature: str | None, secret: str) -> bool:
    if not signature or not secret:
        return False
    expected = compute_paystack_signature(raw_body, secret)
    return hmac.compare_digest(expected, signature)

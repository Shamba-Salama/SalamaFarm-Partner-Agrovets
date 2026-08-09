"""Rate throttles for the unauthenticated OTP endpoints.

Keyed by phone number rather than client IP: the resource we are protecting is
per-phone SMS spend, and many farmers may legitimately share one NAT'd IP.
Falls back to no throttling when the request carries no phone (the serializer
will reject it anyway with a 400).
"""

from __future__ import annotations

from rest_framework.throttling import SimpleRateThrottle

from payments.utils import normalize_kenya_msisdn


class _PhoneScopedThrottle(SimpleRateThrottle):
    def get_cache_key(self, request, view):
        phone = (request.data.get("phone") or "").strip()
        if not phone:
            return None
        try:
            ident = normalize_kenya_msisdn(phone)
        except ValueError:
            ident = phone  # invalid phone still gets a stable bucket
        return self.cache_format % {"scope": self.scope, "ident": ident}


class OTPRequestThrottle(_PhoneScopedThrottle):
    scope = "otp-request"


class OTPVerifyThrottle(_PhoneScopedThrottle):
    scope = "otp-verify"

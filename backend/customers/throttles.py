"""Rate throttles for unauthenticated customer-auth endpoints.

OTP throttles are keyed by phone. Email/login throttles are keyed by email
(or IP fallback) to limit credential stuffing without blocking shared NATs
as harshly as a pure IP bucket would.
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
            ident = phone
        return self.cache_format % {"scope": self.scope, "ident": ident}


class OTPRequestThrottle(_PhoneScopedThrottle):
    scope = "otp-request"


class OTPVerifyThrottle(_PhoneScopedThrottle):
    scope = "otp-verify"


class _EmailScopedThrottle(SimpleRateThrottle):
    def get_cache_key(self, request, view):
        email = (request.data.get("email") or "").strip().lower()
        if email:
            ident = email
        else:
            ident = self.get_ident(request)
        if not ident:
            return None
        return self.cache_format % {"scope": self.scope, "ident": ident}


class CustomerLoginThrottle(_EmailScopedThrottle):
    scope = "customer-login"


class CustomerRegisterThrottle(_EmailScopedThrottle):
    scope = "customer-register"


class CustomerGoogleThrottle(SimpleRateThrottle):
    scope = "customer-google"

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        if not ident:
            return None
        return self.cache_format % {"scope": self.scope, "ident": ident}


class PasswordResetThrottle(_EmailScopedThrottle):
    scope = "customer-password-reset"

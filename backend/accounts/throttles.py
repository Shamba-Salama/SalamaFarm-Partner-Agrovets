"""Rate limits for public vendor auth endpoints."""

from __future__ import annotations

from rest_framework.throttling import SimpleRateThrottle


class VendorLoginThrottle(SimpleRateThrottle):
    """Limit password guesses per email, falling back to IP when email is absent."""

    scope = "vendor-login"

    def get_cache_key(self, request, view):
        email = ""
        data = getattr(request, "data", None)
        if isinstance(data, dict):
            email = str(data.get("email") or "").strip().lower()
        ident = email or self.get_ident(request)
        if not ident:
            return None
        return self.cache_format % {"scope": self.scope, "ident": ident}


class VendorPasswordResetThrottle(SimpleRateThrottle):
    """Limit reset requests per email or reset uid."""

    scope = "vendor-password-reset"

    def get_cache_key(self, request, view):
        data = getattr(request, "data", None)
        ident = ""
        if isinstance(data, dict):
            ident = str(data.get("email") or data.get("uid") or "").strip().lower()
        ident = ident or self.get_ident(request)
        if not ident:
            return None
        return self.cache_format % {"scope": self.scope, "ident": ident}

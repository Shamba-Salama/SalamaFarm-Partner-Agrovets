"""Customer models — global mobile-app identity + auth helpers.

CustomerAccount is a *plain* model, deliberately NOT a second AUTH_USER_MODEL.
It is authenticated via short-lived JWTs (see customers.tokens /
customers.authentication) rather than Django's session/auth machinery.

Primary login is email + password (or Google). Phone OTP remains as a
legacy / optional path; phone stays unique when set (needed for M-Pesa).
"""

from __future__ import annotations

from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.db import models
from django.utils import timezone


class CustomerAccount(models.Model):
    """Farmer / buyer identity shared across every agrovet store.

    Unlike crm.Customer (which is store-scoped), this is one global record per
    person using the mobile app.
    """

    class AuthProvider(models.TextChoices):
        EMAIL = "email", "Email"
        GOOGLE = "google", "Google"
        PHONE_LEGACY = "phone_legacy", "Phone (legacy OTP)"

    class OrgRole(models.TextChoices):
        SUPERADMIN = "superadmin", "Super admin"
        DEVELOPER = "developer", "Developer"

    # Login identity — email is the primary key for password / Google accounts.
    email = models.EmailField(max_length=254, unique=True, null=True, blank=True)
    password = models.CharField(max_length=128, blank=True, default="")
    google_sub = models.CharField(max_length=64, unique=True, null=True, blank=True)
    auth_provider = models.CharField(
        max_length=20,
        choices=AuthProvider.choices,
        default=AuthProvider.PHONE_LEGACY,
    )

    # Optional phone — unique when set; null allowed for email/Google-first.
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True)

    full_name = models.CharField(max_length=120, blank=True)
    farm_name = models.CharField(max_length=120, blank=True)
    farm_type = models.CharField(max_length=60, blank=True)
    location = models.CharField(max_length=160, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    is_org_account = models.BooleanField(default=False)
    org_role = models.CharField(
        max_length=20,
        choices=OrgRole.choices,
        blank=True,
        default="",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["full_name", "email", "phone"]
        verbose_name = "customer account"
        verbose_name_plural = "customer accounts"

    def __str__(self) -> str:
        label = self.full_name or self.email or self.phone or "Customer"
        ident = self.email or self.phone or f"#{self.pk}"
        return f"{label} ({ident})"

    def set_password(self, raw_password: str) -> None:
        self.password = make_password(raw_password)

    def check_password(self, raw_password: str) -> bool:
        if not self.password:
            return False
        return check_password(raw_password, self.password)

    def has_usable_password(self) -> bool:
        return bool(self.password)

    # -- Duck-typing so DRF permissions treat this like an authenticated user.
    @property
    def is_authenticated(self) -> bool:
        return True

    @property
    def is_anonymous(self) -> bool:
        return False


class OTPVerification(models.Model):
    """One issued OTP code for a phone number (hashed, single-use, TTL'd).

    Lockout is *per record*: once attempts_count reaches OTP_MAX_ATTEMPTS the
    row is dead. Recovery is simply requesting a new OTP, which supersedes any
    prior unused rows (see `issue`) and starts a fresh attempts counter.
    """

    phone_number = models.CharField(max_length=20, db_index=True)
    otp_code_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    attempts_count = models.PositiveIntegerField(default=0)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "OTP verification"
        verbose_name_plural = "OTP verifications"
        indexes = [
            models.Index(fields=["phone_number", "is_used", "-created_at"]),
        ]

    def __str__(self) -> str:
        return f"OTP for {self.phone_number} (used={self.is_used})"

    @property
    def max_attempts(self) -> int:
        return int(getattr(settings, "OTP_MAX_ATTEMPTS", 5))

    @property
    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at

    @property
    def attempts_remaining(self) -> int:
        return max(self.max_attempts - self.attempts_count, 0)

    @property
    def is_locked(self) -> bool:
        return self.attempts_count >= self.max_attempts

    @property
    def can_attempt(self) -> bool:
        """True only if this code is still live and has attempts left."""
        return not self.is_used and not self.is_expired and not self.is_locked

    @classmethod
    def issue(cls, phone: str, code: str, ttl_seconds: int | None = None) -> "OTPVerification":
        """Supersede any prior unused OTPs for this phone, then store a fresh one."""
        ttl = ttl_seconds if ttl_seconds is not None else int(getattr(settings, "OTP_TTL_SECONDS", 300))
        cls.objects.filter(phone_number=phone, is_used=False).update(is_used=True)
        return cls.objects.create(
            phone_number=phone,
            otp_code_hash=make_password(code),
            expires_at=timezone.now() + timedelta(seconds=ttl),
        )


class PasswordResetToken(models.Model):
    """Hashed one-time code for email password reset (TTL'd, single-use)."""

    email = models.EmailField(db_index=True)
    code_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    attempts_count = models.PositiveIntegerField(default=0)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    @property
    def max_attempts(self) -> int:
        return int(getattr(settings, "OTP_MAX_ATTEMPTS", 5))

    @property
    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at

    @property
    def attempts_remaining(self) -> int:
        return max(self.max_attempts - self.attempts_count, 0)

    @property
    def is_locked(self) -> bool:
        return self.attempts_count >= self.max_attempts

    @classmethod
    def issue(cls, email: str, code: str, ttl_seconds: int | None = None) -> "PasswordResetToken":
        ttl = ttl_seconds if ttl_seconds is not None else int(
            getattr(settings, "PASSWORD_RESET_TTL_SECONDS", 900)
        )
        normalized = email.strip().lower()
        cls.objects.filter(email=normalized, is_used=False).update(is_used=True)
        return cls.objects.create(
            email=normalized,
            code_hash=make_password(code),
            expires_at=timezone.now() + timedelta(seconds=ttl),
        )

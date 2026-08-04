"""Auth models — vendor accounts for the agrovet portal."""

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class VendorUserManager(BaseUserManager):
    """Manager that authenticates with email instead of username."""

    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


class VendorUser(AbstractUser):
    """Custom user for agrovet vendor accounts (email login)."""

    username = None
    email = models.EmailField("email address", unique=True)
    phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []

    objects = VendorUserManager()

    class Meta:
        verbose_name = "vendor user"
        verbose_name_plural = "vendor users"

    def __str__(self) -> str:
        return self.email

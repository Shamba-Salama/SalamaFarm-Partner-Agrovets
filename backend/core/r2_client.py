"""Boto3 S3-compatible client for Cloudflare R2."""

from __future__ import annotations

import boto3
from botocore.config import Config
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured


def ensure_r2_configured() -> None:
    """Raise if any R2 setting is missing (allows migrate/runserver without R2)."""
    names = (
        "R2_ACCOUNT_ID",
        "R2_ACCESS_KEY_ID",
        "R2_SECRET_ACCESS_KEY",
        "R2_BUCKET",
        "R2_PUBLIC_URL",
    )
    missing = [
        n for n in names if not (getattr(settings, n, None) or "").strip()
    ]
    if missing:
        raise ImproperlyConfigured(
            "R2 is not configured. Set these variables in backend/.env "
            f"(see backend/.env.example): {', '.join(missing)}"
        )


def get_r2_client():
    """Return a boto3 S3 client configured for R2 (S3 API)."""
    ensure_r2_configured()
    return boto3.client(
        "s3",
        endpoint_url=(
            f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
        ),
        region_name="auto",
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
    )

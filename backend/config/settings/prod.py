"""Production settings."""

import os

from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F403
from .base import BASE_DIR, env

DEBUG = False

ALLOWED_HOSTS = env.list(
    "ALLOWED_HOSTS",
    default=[
        "localhost",
        "127.0.0.1",
        "api.salamafarm.com",
        "api-next.salamafarm.com",
    ],
)

CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS",
    default=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
)
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = env.list(
    "CSRF_TRUSTED_ORIGINS",
    default=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
)

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=True)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}


def _configure_database() -> dict:
    """Use DATABASE_URL when set (Postgres on VPS); else sqlite for local prod smoke tests."""
    raw = os.environ.get("DATABASE_URL", "").strip()

    if not raw or raw.startswith("<"):
        return {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": str(BASE_DIR / "db.sqlite3"),
        }

    config = env.db("DATABASE_URL")
    if config.get("ENGINE") == "django.db.backends.postgresql":
        config.setdefault("OPTIONS", {})
        config["OPTIONS"].setdefault("sslmode", "prefer")
        config["CONN_MAX_AGE"] = 60
    return config


DATABASES = {"default": _configure_database()}
if DATABASES["default"].get("ENGINE") == "django.db.backends.postgresql":
    if not DATABASES["default"].get("NAME"):
        raise ImproperlyConfigured("DATABASE_URL is missing a database name.")

"""Production settings."""

import os
from urllib.parse import urlparse

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
        ".onrender.com",
    ],
)

_render_host = os.environ.get("RENDER_EXTERNAL_HOSTNAME")

if _render_host and _render_host not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(_render_host)


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
    default=[],
)

if _render_host:
    origin = f"https://{_render_host}"

    if origin not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(origin)


SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = env.bool(
    "SECURE_SSL_REDIRECT",
    default=True,
)

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
    """
    Render has no Postgres on localhost.

    Prevent Django from trying to connect to localhost when DATABASE_URL
    is missing or incorrectly configured on Render.
    """

    raw = os.environ.get("DATABASE_URL", "").strip()

    on_render = bool(os.environ.get("RENDER"))

    host = urlparse(raw).hostname if raw else ""

    if not raw or raw.startswith("<"):
        if on_render:
            print(
                "WARNING: DATABASE_URL is not set. "
                "Using ephemeral sqlite. "
                "Create a Render PostgreSQL database and set DATABASE_URL "
                "to its Internal Database URL."
            )

        return {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": str(BASE_DIR / "db.sqlite3"),
        }

    if on_render and host in {"localhost", "127.0.0.1", "::1"}:
        print(
            "WARNING: DATABASE_URL points at localhost, which does not exist "
            "on Render. Using ephemeral sqlite until you set DATABASE_URL "
            "to a Render Postgres Internal URL."
        )

        return {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": str(BASE_DIR / "db.sqlite3"),
        }

    config = env.db("DATABASE_URL")

    if on_render:
        config.setdefault("OPTIONS", {})
        config["OPTIONS"].setdefault("sslmode", "require")
        config["CONN_MAX_AGE"] = 60

    return config


DATABASES = {
    "default": _configure_database(),
}


if DATABASES["default"].get("ENGINE") == "django.db.backends.postgresql":
    if not DATABASES["default"].get("NAME"):
        raise ImproperlyConfigured(
            "DATABASE_URL is missing a database name."
        )
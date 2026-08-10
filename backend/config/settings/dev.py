"""Local development settings."""

from .base import *  # noqa: F403

DEBUG = True

# 10.0.2.2 is the Android emulator's alias for the host machine (see the Flutter
# app's ApiConfig); without it the emulator's requests 400 with DisallowedHost.
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "[::1]", "10.0.2.2"]

# Vite default (5173). TanStack Start / Lovable often also serve on 3000.
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]

CORS_ALLOW_CREDENTIALS = True

# Ensure the dev-mode OTP line (customers.sms) is visible on the runserver console.
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {"class": "logging.StreamHandler"},
    },
    "loggers": {
        "customers": {"handlers": ["console"], "level": "INFO", "propagate": False},
    },
}

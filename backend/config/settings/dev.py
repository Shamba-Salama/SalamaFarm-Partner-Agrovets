"""Local development settings."""

import socket

from .base import *  # noqa: F403

DEBUG = True


def _detect_lan_ip() -> str | None:
    """Best-effort LAN IP so a phone on the same Wi‑Fi can reach runserver."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.connect(("8.8.8.8", 80))
            return sock.getsockname()[0]
    except OSError:
        return None


# 10.0.2.2 is the Android emulator's alias for the host machine (see the Flutter
# app's ApiConfig). A physical phone on Wi‑Fi hits the Mac's LAN IP instead —
# auto-detect it here so ALLOWED_HOSTS does not need hand-editing each session.
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "[::1]", "10.0.2.2"]
_lan_ip = _detect_lan_ip()
if _lan_ip:
    ALLOWED_HOSTS.append(_lan_ip)

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

"""
Shared Django settings for SalamaFarm Partner Agrovets API.
"""

from datetime import timedelta
from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env(
    DEBUG=(bool, False),
)

environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("SECRET_KEY")
DEBUG = env("DEBUG")
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=[])

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt",
    # Local
    "core",
    "accounts",
    "stores",
    "catalog",
    "crm",
    "messaging",
    "payments",
    "customers",
    "visits",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": env.db(
        "DATABASE_URL",
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

AUTH_USER_MODEL = "accounts.VendorUser"

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Nairobi"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    # Scoped throttles are applied per-view (customers.throttles); these rates
    # bound the unauthenticated OTP endpoints (per normalized phone number).
    "DEFAULT_THROTTLE_RATES": {
        "otp-request": env("OTP_REQUEST_THROTTLE", default="5/hour"),
        "otp-verify": env("OTP_VERIFY_THROTTLE", default="10/hour"),
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": False,
    "AUTH_HEADER_TYPES": ("Bearer",),
    # VendorUser.USERNAME_FIELD is "email"
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

# Paystack Kenya (test keys — fill in locally, do not commit secrets)
PAYSTACK_SECRET_KEY = env("PAYSTACK_SECRET_KEY", default="")
PAYSTACK_PUBLIC_KEY = env("PAYSTACK_PUBLIC_KEY", default="")
# Subaccount defaults (Kenya). MPTILL = "M-PESA Till" from List Banks (country=kenya).
PAYSTACK_DEFAULT_SETTLEMENT_BANK = env("PAYSTACK_DEFAULT_SETTLEMENT_BANK", default="MPTILL")
# Placeholder marketplace commission: platform keeps 5%, vendor settles ~95%.
# Easy to change later via env or Paystack update_subaccount.
PAYSTACK_DEFAULT_PERCENTAGE_CHARGE = env.float("PAYSTACK_DEFAULT_PERCENTAGE_CHARGE", default=5.0)

# Customer phone auth (mobile app)
# Africa's Talking SMS. Leave AFRICASTALKING_API_KEY blank locally: the OTP is
# then logged to the console instead of sent (see customers.sms.deliver_otp).
AFRICASTALKING_USERNAME = env("AFRICASTALKING_USERNAME", default="sandbox")
AFRICASTALKING_API_KEY = env("AFRICASTALKING_API_KEY", default="")
AFRICASTALKING_SENDER_ID = env("AFRICASTALKING_SENDER_ID", default="")
# Force the log-only OTP path even when a key is present (handy in staging).
OTP_DEV_MODE = env.bool("OTP_DEV_MODE", default=False)
OTP_TTL_SECONDS = env.int("OTP_TTL_SECONDS", default=300)  # 5 min
OTP_MAX_ATTEMPTS = env.int("OTP_MAX_ATTEMPTS", default=5)

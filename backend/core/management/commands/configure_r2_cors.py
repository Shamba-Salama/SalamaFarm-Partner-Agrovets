"""Apply browser CORS rules on the Cloudflare R2 bucket (required for direct PUT uploads)."""

from __future__ import annotations

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from core.r2_client import ensure_r2_configured, get_r2_client

DEFAULT_DEV_ORIGINS = (
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
)


def _parse_origins(raw: str) -> list[str]:
    return [part.strip() for part in raw.split(",") if part.strip()]


class Command(BaseCommand):
    help = (
        "Set R2 bucket CORS so the vendor portal can PUT images from the browser "
        "(presigned upload flow). Run once per bucket or after adding a new frontend origin."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--origins",
            dest="origins",
            default="",
            help="Comma-separated origins (e.g. http://localhost:8080,https://portal.example.com). "
            "Default: R2_CORS_ORIGINS from settings/env, else built-in local dev list.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Print the CORS rule without calling the R2 API.",
        )

    def handle(self, *args, **options):
        try:
            ensure_r2_configured()
        except Exception as exc:
            raise CommandError(str(exc)) from exc

        bucket = settings.R2_BUCKET
        raw = (options.get("origins") or "").strip()
        if raw:
            origins = _parse_origins(raw)
        else:
            configured = getattr(settings, "R2_CORS_ORIGINS", None) or []
            origins = list(configured) if configured else list(DEFAULT_DEV_ORIGINS)

        if not origins:
            raise CommandError("No origins to apply. Pass --origins or set R2_CORS_ORIGINS.")

        cors = {
            "CORSRules": [
                {
                    "AllowedOrigins": origins,
                    "AllowedMethods": ["GET", "PUT", "HEAD"],
                    "AllowedHeaders": ["*"],
                    "ExposeHeaders": ["ETag"],
                    "MaxAgeSeconds": 3600,
                }
            ]
        }

        self.stdout.write(f"Bucket: {bucket}")
        self.stdout.write("Origins:")
        for origin in origins:
            self.stdout.write(f"  - {origin}")

        if options.get("dry_run"):
            self.stdout.write(self.style.WARNING("Dry run — not calling R2."))
            return

        client = get_r2_client()
        try:
            client.put_bucket_cors(Bucket=bucket, CORSConfiguration=cors)
        except Exception as exc:
            raise CommandError(f"put_bucket_cors failed: {exc}") from exc

        self.stdout.write(self.style.SUCCESS("R2 bucket CORS updated. Retry image upload in the portal."))

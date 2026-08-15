"""
Copy Salama gallery photos onto products that still have no uploaded image.

Does not overwrite a photo an agrovet already uploaded. Name match is preferred;
same-category gallery photos fill remaining emoji-only rows (one-time backfill).

Usage (from backend/):

  .venv/bin/python manage.py apply_gallery_images --dry-run
  .venv/bin/python manage.py apply_gallery_images
"""

from __future__ import annotations

from pathlib import Path

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError

from catalog.gallery import gallery_dir, resolve_gallery_item
from catalog.models import Product


class Command(BaseCommand):
    help = "Attach Salama gallery photos to products that have no uploaded image."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Print matches without writing files or updating the database.",
        )
        parser.add_argument(
            "--name-only",
            action="store_true",
            help="Only attach a photo when the product title matches a gallery pack.",
        )

    def handle(self, *args, **options):
        dry_run = bool(options["dry_run"])
        fill_category = not bool(options["name_only"])
        try:
            source_dir = gallery_dir()
        except FileNotFoundError as exc:
            raise CommandError(str(exc)) from exc

        attached = 0
        skipped_has_image = 0
        unmatched = 0

        products = Product.objects.order_by("id")
        for product in products:
            if product.image:
                skipped_has_image += 1
                continue

            resolved = resolve_gallery_item(
                product.name,
                product.category,
                product.id,
                fill_category=fill_category,
            )
            if resolved is None:
                unmatched += 1
                self.stdout.write(f"SKIP  id={product.id}  {product.name!r}  (no gallery match)")
                continue

            item, reason = resolved
            src = source_dir / item.file
            if not src.is_file():
                raise CommandError(f"Gallery file missing: {src}")

            self.stdout.write(
                f"{'DRY ' if dry_run else 'OK   '}id={product.id}  {product.name!r}  "
                f"<- {item.file}  ({reason})"
            )
            if dry_run:
                attached += 1
                continue

            payload = Path(src).read_bytes()
            filename = f"{product.id}-{item.file}"
            product.image.save(filename, ContentFile(payload), save=True)
            attached += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. attached={attached} already_had_photo={skipped_has_image} unmatched={unmatched}"
                + (" (dry-run)" if dry_run else "")
            )
        )

"""CSV helpers for bulk product import (matches portal CsvImportDialog columns)."""

from __future__ import annotations

import csv
import io
from datetime import date, datetime
from decimal import Decimal, InvalidOperation

from .models import Product

REQUIRED_HEADERS = {
    "product_name",
    "category",
    "price_kes",
    "stock_quantity",
    "unit_description",
    "expiry_date",
}

VALID_CATEGORIES = {c.value for c in Product.Category}


def _parse_expiry(raw: str) -> date | None:
    raw = (raw or "").strip()
    if not raw:
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y"):
        try:
            return datetime.strptime(raw, fmt).date()
        except ValueError:
            continue
    raise ValueError(f"Invalid expiry_date: {raw!r}")


def parse_products_csv(text: str) -> list[dict]:
    """
    Parse CSV text into Product field dicts (without store).

    Columns: product_name, category, price_kes, stock_quantity,
    unit_description, expiry_date.
    """
    stream = io.StringIO(text.strip())
    reader = csv.DictReader(stream)
    if not reader.fieldnames:
        raise ValueError("CSV has no header row.")

    headers = {h.strip().lower() for h in reader.fieldnames if h}
    missing = REQUIRED_HEADERS - headers
    if missing:
        raise ValueError(f"Missing CSV columns: {', '.join(sorted(missing))}")

    rows: list[dict] = []
    for i, row in enumerate(reader, start=2):
        normalized = {(k or "").strip().lower(): (v or "").strip() for k, v in row.items()}
        name = normalized.get("product_name", "")
        if not name:
            continue

        category = normalized.get("category", "") or Product.Category.FERTILIZER
        if category not in VALID_CATEGORIES:
            category = Product.Category.FERTILIZER

        try:
            price = Decimal(normalized.get("price_kes") or "0")
        except InvalidOperation as exc:
            raise ValueError(f"Row {i}: invalid price_kes") from exc

        try:
            stock = int(Decimal(normalized.get("stock_quantity") or "0"))
        except (InvalidOperation, ValueError) as exc:
            raise ValueError(f"Row {i}: invalid stock_quantity") from exc

        try:
            expiry = _parse_expiry(normalized.get("expiry_date", ""))
        except ValueError as exc:
            raise ValueError(f"Row {i}: {exc}") from exc

        rows.append(
            {
                "name": name,
                "category": category,
                "description": normalized.get("unit_description", ""),
                "price": price,
                "stock": max(stock, 0),
                "expiry": expiry,
                "image_emoji": "📦",
                "active": True,
            }
        )

    return rows

"""Phone / amount helpers for Paystack Kenya charges."""

from __future__ import annotations

import re
from decimal import ROUND_HALF_UP, Decimal


def normalize_kenya_msisdn(phone: str) -> str:
    """
    Normalize a Kenyan mobile number to +254XXXXXXXXX.

    Accepts 07…, 254…, +254…, and strips spaces/dashes.
    """
    raw = (phone or "").strip()
    if not raw:
        raise ValueError("Phone number is required.")

    digits = re.sub(r"\D", "", raw)
    if digits.startswith("0") and len(digits) == 10:
        digits = "254" + digits[1:]
    if digits.startswith("254") and len(digits) == 12:
        return f"+{digits}"
    if digits.startswith("254") and len(digits) > 12:
        # already country-coded with extra chars stripped poorly
        return f"+{digits[:12]}"

    raise ValueError(
        f"Invalid Kenyan phone {phone!r}. Use 07XXXXXXXX or +2547XXXXXXXX."
    )


def kes_to_cents(amount: Decimal | int | str | float) -> int:
    """Convert KES major units to the smallest currency unit (cents/cents)."""
    value = Decimal(str(amount))
    cents = (value * Decimal("100")).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    return int(cents)

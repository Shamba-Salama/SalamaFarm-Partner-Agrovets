"""Kenya-specific store field validation."""

import re

KENYA_COUNTIES = frozenset(
    {
        "Baringo",
        "Bomet",
        "Bungoma",
        "Busia",
        "Elgeyo-Marakwet",
        "Embu",
        "Garissa",
        "Homa Bay",
        "Isiolo",
        "Kajiado",
        "Kakamega",
        "Kericho",
        "Kiambu",
        "Kilifi",
        "Kirinyaga",
        "Kisii",
        "Kisumu",
        "Kitui",
        "Kwale",
        "Laikipia",
        "Lamu",
        "Machakos",
        "Makueni",
        "Mandera",
        "Marsabit",
        "Meru",
        "Migori",
        "Mombasa",
        "Murang'a",
        "Nairobi",
        "Nakuru",
        "Nandi",
        "Narok",
        "Nyamira",
        "Nyandarua",
        "Nyeri",
        "Samburu",
        "Siaya",
        "Taita-Taveta",
        "Tana River",
        "Tharaka-Nithi",
        "Trans Nzoia",
        "Turkana",
        "Uasin Gishu",
        "Vihiga",
        "Wajir",
        "West Pokot",
    }
)

_COUNTY_KEY = str.maketrans({"'": "", "’": ""})


def normalize_county_key(value: str) -> str:
    return " ".join(value.strip().lower().translate(_COUNTY_KEY).split())


def resolve_kenya_county(value: str) -> str | None:
    if not value or not value.strip():
        return None
    key = normalize_county_key(value)
    for county in KENYA_COUNTIES:
        if normalize_county_key(county) == key:
            return county
    return None


def normalize_kenya_phone(raw: str) -> str | None:
    digits = re.sub(r"\D", "", raw or "")
    if re.fullmatch(r"0[17]\d{8}", digits):
        return digits
    if re.fullmatch(r"254[17]\d{8}", digits):
        return f"0{digits[3:]}"
    return None

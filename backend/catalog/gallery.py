"""Salama product-gallery matching for one-time image backfill.

Portal picker still lives in the frontend; this module is used by the
management command that copies a gallery PNG onto Product.image when the
agrovet has not uploaded a photo yet.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class GalleryItem:
    id: str
    name: str
    category: str
    file: str
    keywords: tuple[str, ...]


GALLERY: tuple[GalleryItem, ...] = (
    GalleryItem(
        "biofix-legume-inoculant",
        "BIOFIX Legume Inoculant (Bean)",
        "Fertilizer",
        "biofix-legume-inoculant.png",
        ("biofix", "inoculant"),
    ),
    GalleryItem(
        "vuna-fertilizer",
        "VUNA Fertilizer",
        "Fertilizer",
        "vuna-fertilizer.png",
        ("vuna",),
    ),
    GalleryItem(
        "easygro-starter",
        "EasyGro STARTER 18:20:21+TE",
        "Fertilizer",
        "easygro-starter.png",
        ("easygro", "easy gro"),
    ),
    GalleryItem(
        "mycoapply-endoprime",
        "MycoApply EndoPrime EA",
        "Fertilizer",
        "mycoapply-endoprime.png",
        ("mycoapply", "endoprime"),
    ),
    GalleryItem(
        "simlaw-coriander-dania",
        "Simlaw Seeds Coriander Dania",
        "Seeds",
        "simlaw-coriander-dania.png",
        ("coriander", "dania"),
    ),
    GalleryItem(
        "kenya-seed-h629",
        "Kenya Seed Hybrid Maize H 629",
        "Seeds",
        "kenya-seed-h629.png",
        ("h629", "h 629"),
    ),
    GalleryItem(
        "simlaw-kazuri-beans",
        "Simlaw Seeds Kazuri Beans 1kg",
        "Seeds",
        "simlaw-kazuri-beans.png",
        ("kazuri",),
    ),
    GalleryItem(
        "ckl-milking-salve",
        "CKL Milking Salve 250g",
        "Vet Supplies",
        "ckl-milking-salve.png",
        ("milking salve",),
    ),
    GalleryItem(
        "actellic-super",
        "Actellic Super Dusting Powder",
        "Pesticides",
        "actellic-super.png",
        ("actellic",),
    ),
    GalleryItem(
        "alonze-50ec",
        "Alonze 50EC",
        "Pesticides",
        "alonze-50ec.png",
        ("alonze",),
    ),
    GalleryItem(
        "amistar",
        "Amistar",
        "Pesticides",
        "amistar.png",
        ("amistar",),
    ),
    GalleryItem(
        "bedlam-200sl",
        "BEDLAM 200SL",
        "Pesticides",
        "bedlam-200sl.png",
        ("bedlam",),
    ),
    GalleryItem(
        "duduthrin-175ec",
        "Duduthrin 1.75EC",
        "Pesticides",
        "duduthrin-175ec.png",
        ("duduthrin",),
    ),
    GalleryItem(
        "bactrolure",
        "Bactrolure 98.9% Liquid",
        "Pesticides",
        "bactrolure.png",
        ("bactrolure",),
    ),
    GalleryItem(
        "lexus-247sc",
        "Lexus 247 SC",
        "Pesticides",
        "lexus-247sc.png",
        ("lexus 247", "lexus247"),
    ),
    GalleryItem(
        "ridomil-gold",
        "Ridomil Gold MZ 68 WG",
        "Pesticides",
        "ridomil-gold.png",
        ("ridomil",),
    ),
    GalleryItem(
        "occasion-star-200sc",
        "Occasion Star 200 SC",
        "Pesticides",
        "occasion-star-200sc.png",
        ("occasion star",),
    ),
    GalleryItem(
        "pentagon-50ec",
        "Pentagon 50EC",
        "Pesticides",
        "pentagon-50ec.png",
        ("pentagon",),
    ),
    GalleryItem(
        "president-gold-20dp",
        "President Gold 20 DP",
        "Pesticides",
        "president-gold-20dp.png",
        ("president gold",),
    ),
    GalleryItem(
        "indoking-300sc",
        "Indoking 300 SC",
        "Pesticides",
        "indoking-300sc.png",
        ("indoking",),
    ),
)

GALLERY_BY_ID = {item.id: item for item in GALLERY}

_CATEGORY_FALLBACK_IDS: dict[str, tuple[str, ...]] = {
    "Fertilizer": (
        "easygro-starter",
        "vuna-fertilizer",
        "biofix-legume-inoculant",
        "mycoapply-endoprime",
    ),
    "Seeds": (
        "kenya-seed-h629",
        "simlaw-kazuri-beans",
        "simlaw-coriander-dania",
    ),
    "Vet Supplies": ("ckl-milking-salve",),
    "Pesticides": (
        "alonze-50ec",
        "duduthrin-175ec",
        "amistar",
        "actellic-super",
        "ridomil-gold",
        "occasion-star-200sc",
        "pentagon-50ec",
        "president-gold-20dp",
        "indoking-300sc",
        "lexus-247sc",
        "bedlam-200sl",
        "bactrolure",
    ),
}


def gallery_dir() -> Path:
    repo_root = Path(__file__).resolve().parents[2]
    path = repo_root / "public" / "product-gallery"
    if not path.is_dir():
        raise FileNotFoundError(f"Product gallery folder not found: {path}")
    return path


def normalize_name(name: str) -> str:
    cleaned = re.sub(r"\[mp\]", " ", name, flags=re.IGNORECASE)
    cleaned = cleaned.lower().replace("+", " ")
    cleaned = re.sub(r"[^a-z0-9]+", " ", cleaned)
    return re.sub(r"\s+", " ", cleaned).strip()


def infer_category(product_name: str, stored_category: str) -> str:
    """Prefer distinctive words in the title over a mis-tagged catalog category."""
    haystack = f" {normalize_name(product_name)} "
    vet_needles = (
        " milking ",
        " salve ",
        " tick ",
        " grease ",
        " mash ",
        " shampoo ",
        " triatix ",
        " stock spray ",
        " teat ",
    )
    seed_needles = (" seed ", " seeds ", " maize ", " bean ", " beans ", " dania ", " coriander ")
    pesticide_needles = (
        " insecticide ",
        " herbicide ",
        " fungicide ",
        " pesticide ",
        " roundup ",
        " spray ",
    )
    fertilizer_needles = (" fertilizer ", " dap ", " urea ", " mbolea ", " can ")
    if any(n in haystack for n in vet_needles):
        return "Vet Supplies"
    if any(n in haystack for n in seed_needles):
        return "Seeds"
    if any(n in haystack for n in pesticide_needles):
        return "Pesticides"
    if any(n in haystack for n in fertilizer_needles):
        return "Fertilizer"
    return stored_category


def match_gallery_item(product_name: str) -> GalleryItem | None:
    """Return a gallery pack when the product title contains a distinctive keyword."""
    haystack = f" {normalize_name(product_name)} "
    best: tuple[int, GalleryItem] | None = None
    for item in GALLERY:
        for keyword in item.keywords:
            needle = f" {normalize_name(keyword)} "
            if needle in haystack or haystack.strip() == needle.strip():
                score = len(keyword)
                if best is None or score > best[0]:
                    best = (score, item)
    return best[1] if best else None


def category_fallback_item(category: str, product_id: int) -> GalleryItem | None:
    ids = _CATEGORY_FALLBACK_IDS.get(category) or ()
    if not ids:
        return None
    return GALLERY_BY_ID[ids[product_id % len(ids)]]


def resolve_gallery_item(
    product_name: str,
    category: str,
    product_id: int,
    *,
    fill_category: bool,
) -> tuple[GalleryItem, str] | None:
    matched = match_gallery_item(product_name)
    if matched:
        return matched, "name"
    if fill_category:
        inferred = infer_category(product_name, category)
        fallback = category_fallback_item(inferred, product_id)
        if fallback:
            return fallback, "category"
    return None

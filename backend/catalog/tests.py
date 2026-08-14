from django.test import SimpleTestCase

from catalog.gallery import match_gallery_item, resolve_gallery_item


class GalleryMatchTests(SimpleTestCase):
    def test_matches_ridomil_variant_names(self):
        item = match_gallery_item("Ridomil Gold MZ 68WG")
        self.assertIsNotNone(item)
        self.assertEqual(item.id, "ridomil-gold")

    def test_matches_milking_salve(self):
        item = match_gallery_item("Milking Salve Teat Jelly")
        self.assertIsNotNone(item)
        self.assertEqual(item.id, "ckl-milking-salve")

    def test_does_not_map_h614_to_h629(self):
        self.assertIsNone(match_gallery_item("Hybrid Maize Seed H614"))
        self.assertIsNone(match_gallery_item("[MP] Maize Seed H614"))

    def test_does_not_map_dudukrin_to_duduthrin(self):
        self.assertIsNone(match_gallery_item("Dudukrin Pet Shampoo"))

    def test_does_not_match_generic_fertilizer(self):
        self.assertIsNone(match_gallery_item("DAP Fertilizer 50KG"))

    def test_category_fallback_only_when_requested(self):
        name_only = resolve_gallery_item("DAP Fertilizer 50KG", "Fertilizer", 1, fill_category=False)
        self.assertIsNone(name_only)
        filled = resolve_gallery_item("DAP Fertilizer 50KG", "Fertilizer", 1, fill_category=True)
        self.assertIsNotNone(filled)
        item, reason = filled
        self.assertEqual(reason, "category")
        self.assertEqual(item.category, "Fertilizer")

    def test_infers_seeds_when_catalog_category_is_wrong(self):
        filled = resolve_gallery_item("Hybrid Maize Seed H614", "Fertilizer", 3, fill_category=True)
        self.assertIsNotNone(filled)
        item, reason = filled
        self.assertEqual(reason, "category")
        self.assertEqual(item.category, "Seeds")

    def test_infers_pesticides_for_insecticide_mislabeled_as_fertilizer(self):
        filled = resolve_gallery_item("Belt 480 SC Insecticide", "Fertilizer", 7, fill_category=True)
        self.assertIsNotNone(filled)
        item, _reason = filled
        self.assertEqual(item.category, "Pesticides")

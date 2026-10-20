from django.urls import reverse
from rest_framework.test import APITestCase

from accounts.models import VendorUser
from stores.models import AgrovetStore

from .models import Product


class ProductPublicationTests(APITestCase):
    def setUp(self):
        self.vendor = VendorUser.objects.create_user(
            email="vendor@example.com",
            password="test-password",
        )
        self.store = AgrovetStore.objects.create(
            owner=self.vendor,
            name="Test Agrovet",
            town="Nairobi",
            county="Nairobi",
            till="123456",
            attendant_phone="+254700000000",
            open=True,
        )
        self.client.force_authenticate(user=self.vendor)

    def make_product(self, *, name, status=Product.Status.DRAFT, active=True):
        return Product.objects.create(
            store=self.store,
            name=name,
            category=Product.Category.SEEDS,
            price="100.00",
            stock=5,
            status=status,
            active=active,
        )

    def test_new_products_default_to_draft_and_vendor_api_exposes_status(self):
        product = self.make_product(name="New seeds")

        response = self.client.get(reverse("product-list"))

        self.assertEqual(product.status, Product.Status.DRAFT)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]["status"], Product.Status.DRAFT)

    def test_marketplace_only_returns_published_active_products_from_open_stores(self):
        published = self.make_product(name="Published", status=Product.Status.PUBLISHED)
        self.make_product(name="Draft")
        self.make_product(name="Pending", status=Product.Status.PENDING)
        self.make_product(name="Archived", status=Product.Status.ARCHIVED)
        self.make_product(name="Inactive published", status=Product.Status.PUBLISHED, active=False)

        closed_vendor = VendorUser.objects.create_user(
            email="closed@example.com",
            password="test-password",
        )
        closed_store = AgrovetStore.objects.create(
            owner=closed_vendor,
            name="Closed Agrovet",
            town="Nairobi",
            county="Nairobi",
            till="654321",
            attendant_phone="+254711111111",
            open=False,
        )
        Product.objects.create(
            store=closed_store,
            name="Closed-store published",
            category=Product.Category.SEEDS,
            price="100.00",
            stock=5,
            status=Product.Status.PUBLISHED,
        )

        response = self.client.get(reverse("marketplace-product-list"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [row["id"] for row in response.data["results"]],
            [published.id],
        )

    def test_vendor_publish_submits_product_for_admin_review(self):
        product = self.make_product(name="Review me")

        response = self.client.post(reverse("product-publish", args=[product.id]))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], Product.Status.PENDING)
        product.refresh_from_db()
        self.assertEqual(product.status, Product.Status.PENDING)

    def test_vendor_cannot_bypass_admin_review_with_product_update(self):
        product = self.make_product(name="No direct publish")

        response = self.client.patch(
            reverse("product-detail", args=[product.id]),
            {"status": Product.Status.PUBLISHED},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("status", response.data)
        product.refresh_from_db()
        self.assertEqual(product.status, Product.Status.DRAFT)

    def test_unpublish_moves_pending_product_back_to_draft(self):
        product = self.make_product(name="Withdraw me", status=Product.Status.PENDING)

        response = self.client.post(reverse("product-unpublish", args=[product.id]))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], Product.Status.DRAFT)

    def test_archive_removes_published_product_from_marketplace(self):
        product = self.make_product(name="Archive me", status=Product.Status.PUBLISHED)

        response = self.client.post(reverse("product-archive", args=[product.id]))
        marketplace = self.client.get(reverse("marketplace-product-list"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], Product.Status.ARCHIVED)
        self.assertEqual(marketplace.data["results"], [])

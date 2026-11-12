"""Tests for core API helpers."""

from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model
from django.test.utils import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class PresignedUploadUrlTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="vendor@example.com",
            password="testpass123",
        )
        self.client.force_authenticate(user=self.user)

    def test_requires_authentication(self):
        self.client.force_authenticate(user=None)
        res = self.client.post("/api/upload-url/", {"contentType": "image/png"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_rejects_invalid_content_type(self):
        res = self.client.post(
            "/api/upload-url/", {"contentType": "image/gif"}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", res.data)

    @override_settings(
        R2_ACCOUNT_ID="",
        R2_ACCESS_KEY_ID="",
        R2_SECRET_ACCESS_KEY="",
        R2_BUCKET="",
        R2_PUBLIC_URL="",
    )
    def test_returns_503_when_r2_not_configured(self):
        res = self.client.post(
            "/api/upload-url/", {"contentType": "image/png"}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertIn("detail", res.data)
        self.assertIn("R2", res.data["detail"])

    @patch("core.upload_views.get_r2_client")
    def test_valid_request_returns_urls(self, mock_get_client):
        mock_client = MagicMock()
        mock_client.generate_presigned_url.return_value = (
            "https://example.r2.cloudflarestorage.com/bucket/presigned"
        )
        mock_get_client.return_value = mock_client

        res = self.client.post(
            "/api/upload-url/", {"contentType": "image/webp"}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["uploadUrl"], mock_client.generate_presigned_url.return_value)
        self.assertIn("publicUrl", res.data)
        self.assertTrue(res.data["publicUrl"].endswith(".webp"))

        call_kw = mock_client.generate_presigned_url.call_args
        self.assertEqual(call_kw[0][0], "put_object")
        params = call_kw[1]["Params"]
        self.assertEqual(params["ContentType"], "image/webp")
        self.assertTrue(params["Key"].startswith("uploads/"))
        self.assertEqual(call_kw[1]["ExpiresIn"], 300)

"""Presigned direct-upload URLs for Cloudflare R2."""

from __future__ import annotations

import uuid

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .r2_client import get_r2_client

ALLOWED_IMAGE_TYPES = frozenset({"image/jpeg", "image/png", "image/webp"})
CONTENT_TYPE_TO_EXT = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}


class PresignedUploadUrlView(APIView):
    """
    POST { "contentType": "image/jpeg" } -> presigned PUT URL + final public URL.

    Bytes go directly to R2; they never pass through Django.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        raw = request.data.get("contentType", request.data.get("content_type"))
        if not isinstance(raw, str) or not raw.strip():
            return Response(
                {"detail": "contentType is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        content_type = raw.strip().lower()
        if content_type not in ALLOWED_IMAGE_TYPES:
            return Response(
                {"detail": "Allowed content types: image/jpeg, image/png, image/webp."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ext = CONTENT_TYPE_TO_EXT[content_type]
        key = f"uploads/{uuid.uuid4()}.{ext}"
        try:
            client = get_r2_client()
        except ImproperlyConfigured as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        upload_url = client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.R2_BUCKET,
                "Key": key,
                "ContentType": content_type,
            },
            ExpiresIn=300,
        )
        public_url = f"{settings.R2_PUBLIC_URL}/{key}"
        return Response({"uploadUrl": upload_url, "publicUrl": public_url})

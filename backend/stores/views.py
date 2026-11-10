"""Store API — singleton for the authenticated vendor's AgrovetStore."""

from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions

from .models import AgrovetStore
from .serializers import AgrovetStoreSerializer


class StoreView(generics.RetrieveUpdateAPIView):
    """
    GET /store/  — current vendor's store
    PATCH /store/ — update profile / open / onboarded

    Resolves exclusively via request.user.store (never a URL/body store id).
    """

    serializer_class = AgrovetStoreSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "patch", "head", "options"]

    def get_object(self) -> AgrovetStore:
        # Ignore any stray id in the body; tenants are bound to the JWT user.
        return get_object_or_404(AgrovetStore, owner=self.request.user)

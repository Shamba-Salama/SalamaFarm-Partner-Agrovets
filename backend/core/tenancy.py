"""Shared helpers for store-scoped API views."""

from django.shortcuts import get_object_or_404

from stores.models import AgrovetStore


def get_vendor_store(user) -> AgrovetStore:
    """Resolve the authenticated vendor's AgrovetStore (404 if missing)."""
    return get_object_or_404(AgrovetStore, owner=user)

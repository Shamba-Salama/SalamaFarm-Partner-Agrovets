"""Permissions for customer-authenticated endpoints."""

from __future__ import annotations

from rest_framework.permissions import BasePermission

from .models import CustomerAccount


class IsAuthenticatedCustomer(BasePermission):
    """Require request.user to be an actual CustomerAccount instance.

    Stronger than IsAuthenticated: guards against any authenticator returning a
    non-customer user (e.g. a VendorUser) reaching a customer view.
    """

    message = "Authentication as a customer is required."

    def has_permission(self, request, view) -> bool:
        return isinstance(request.user, CustomerAccount)

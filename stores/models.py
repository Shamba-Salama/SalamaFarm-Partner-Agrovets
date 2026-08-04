"""Agrovet store profiles — one store per vendor."""

from django.conf import settings
from django.db import models


class AgrovetStore(models.Model):
    """Tenant root: a single agrovet store owned by one VendorUser."""

    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="store",
    )
    name = models.CharField(max_length=120)
    town = models.CharField(max_length=80)
    county = models.CharField(max_length=80)
    till = models.CharField(max_length=20)
    attendant_phone = models.CharField(max_length=20)
    paystack_subaccount_code = models.CharField(
        max_length=64,
        blank=True,
        help_text="Paystack subaccount code for split settlements to this agrovet",
    )
    open = models.BooleanField(default=True)
    onboarded = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "agrovet store"
        verbose_name_plural = "agrovet stores"

    def __str__(self) -> str:
        return self.name

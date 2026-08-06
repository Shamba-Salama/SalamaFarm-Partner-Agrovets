"""Catalog / inventory models."""

from django.db import models

from core.models import BaseStoreOwnedModel


class Product(BaseStoreOwnedModel):
    """Shelf item for an agrovet store."""

    class Category(models.TextChoices):
        FERTILIZER = "Fertilizer", "Fertilizer"
        SEEDS = "Seeds", "Seeds"
        VET_SUPPLIES = "Vet Supplies", "Vet Supplies"
        PESTICIDES = "Pesticides", "Pesticides"

    name = models.CharField(max_length=160)
    category = models.CharField(max_length=32, choices=Category.choices)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    expiry = models.DateField(null=True, blank=True)
    image_emoji = models.CharField(max_length=8, blank=True, default="📦")
    image = models.ImageField(upload_to="products/", blank=True, null=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "product"
        verbose_name_plural = "products"

    def __str__(self) -> str:
        return self.name

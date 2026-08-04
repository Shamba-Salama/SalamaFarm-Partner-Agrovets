"""Shared abstract models and query helpers."""

from django.db import models


class StoreOwnedQuerySet(models.QuerySet):
    def for_store(self, store):
        """Limit results to a single AgrovetStore (or store pk)."""
        return self.filter(store=store)


class StoreOwnedManager(models.Manager.from_queryset(StoreOwnedQuerySet)):
    """Default manager with store-scoping helpers."""


class BaseStoreOwnedModel(models.Model):
    """
    Abstract base for multi-tenant rows that belong to one AgrovetStore.

    Subclasses: Product, Customer, CustomerOrder, Thread, etc.
    """

    store = models.ForeignKey(
        "stores.AgrovetStore",
        on_delete=models.CASCADE,
        related_name="%(app_label)s_%(class)s_set",
    )

    objects = StoreOwnedManager()

    class Meta:
        abstract = True

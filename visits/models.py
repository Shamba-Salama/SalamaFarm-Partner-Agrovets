"""Store visit tracking — customer navigation started / arrived."""

from django.db import models
from django.db.models import Q


class StoreVisit(models.Model):
    """A customer journey toward an agrovet store (Maps deep-link + arrival)."""

    class Status(models.TextChoices):
        STARTED = "started", "started"
        ARRIVED = "arrived", "arrived"

    store = models.ForeignKey(
        "stores.AgrovetStore",
        on_delete=models.CASCADE,
        related_name="visits",
    )
    account = models.ForeignKey(
        "customers.CustomerAccount",
        on_delete=models.CASCADE,
        related_name="store_visits",
    )
    product = models.ForeignKey(
        "catalog.Product",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="store_visits",
    )
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.STARTED,
    )
    started_at = models.DateTimeField()
    arrived_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-started_at"]
        verbose_name = "store visit"
        verbose_name_plural = "store visits"
        constraints = [
            models.UniqueConstraint(
                fields=["account", "store"],
                condition=Q(status="started"),
                name="visits_one_open_started_per_account_store",
            ),
        ]

    def __str__(self) -> str:
        return f"visit {self.pk} account={self.account_id} store={self.store_id} {self.status}"

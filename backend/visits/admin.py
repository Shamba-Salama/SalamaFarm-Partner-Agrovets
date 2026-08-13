from django.contrib import admin

from .models import StoreVisit


@admin.register(StoreVisit)
class StoreVisitAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "store",
        "account",
        "product",
        "status",
        "started_at",
        "arrived_at",
    )
    list_filter = ("status", "store")
    search_fields = ("account__phone", "store__name")
    readonly_fields = ("created_at", "updated_at")

from django.contrib import admin

from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "store",
        "category",
        "price",
        "stock",
        "expiry",
        "active",
        "updated_at",
    )
    list_filter = ("category", "active", "store")
    search_fields = ("name", "description", "store__name")
    readonly_fields = ("created_at", "updated_at")
    raw_id_fields = ("store",)
    list_select_related = ("store",)
    list_editable = ("active",)

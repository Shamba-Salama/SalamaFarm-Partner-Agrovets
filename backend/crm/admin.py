from django.contrib import admin

from .models import Customer, CustomerOrder, OrderItem


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ("name", "phone", "store", "updated_at")
    list_filter = ("store",)
    search_fields = ("name", "phone", "store__name")
    readonly_fields = ("created_at", "updated_at")
    raw_id_fields = ("store",)
    list_select_related = ("store",)


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 1
    raw_id_fields = ("product",)


@admin.register(CustomerOrder)
class CustomerOrderAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "customer",
        "store",
        "amount",
        "status",
        "pickup",
        "channel",
        "mpesa_code",
        "paid_at",
        "created_at",
    )
    list_filter = ("status", "pickup", "channel", "order_type", "store")
    search_fields = (
        "mpesa_code",
        "customer__name",
        "customer__phone",
        "store__name",
    )
    readonly_fields = ("created_at", "updated_at")
    raw_id_fields = ("store", "customer")
    list_select_related = ("store", "customer")
    inlines = [OrderItemInline]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    """Standalone list for inspection; prefer editing via CustomerOrder inline."""

    list_display = ("id", "order", "product", "qty", "price")
    list_filter = ("order__store",)
    search_fields = ("product__name", "order__mpesa_code", "order__customer__name")
    raw_id_fields = ("order", "product")
    list_select_related = ("order", "product", "order__customer")

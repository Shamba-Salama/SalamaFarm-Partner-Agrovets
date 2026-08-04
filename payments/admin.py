from django.contrib import admin

from .models import MpesaTransaction


@admin.register(MpesaTransaction)
class MpesaTransactionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "kind",
        "status",
        "reference",
        "phone",
        "amount",
        "mpesa_receipt",
        "store",
        "order",
        "created_at",
    )
    list_filter = ("kind", "status", "store")
    search_fields = (
        "phone",
        "mpesa_receipt",
        "reference",
        "subaccount_code",
        "customer__name",
        "customer__phone",
    )
    readonly_fields = ("created_at", "updated_at", "raw_webhook")
    raw_id_fields = ("store", "order", "customer")
    list_select_related = ("store", "order", "customer")

    fieldsets = (
        (
            None,
            {
                "fields": (
                    "store",
                    "kind",
                    "status",
                    "reference",
                    "subaccount_code",
                    "phone",
                    "amount",
                    "mpesa_receipt",
                    "result_desc",
                )
            },
        ),
        (
            "Links",
            {"fields": ("order", "customer")},
        ),
        (
            "Webhook payload",
            {
                "fields": ("raw_webhook",),
                "classes": ("collapse",),
                "description": "Full Paystack webhook JSON for audit. Read-only.",
            },
        ),
        (
            "Timestamps",
            {
                "fields": ("created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )

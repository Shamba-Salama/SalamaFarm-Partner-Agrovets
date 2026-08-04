from django.contrib import admin

from .models import AgrovetStore


@admin.register(AgrovetStore)
class AgrovetStoreAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "owner",
        "town",
        "county",
        "till",
        "paystack_subaccount_code",
        "open",
        "onboarded",
        "updated_at",
    )
    list_filter = ("open", "onboarded", "county")
    search_fields = (
        "name",
        "town",
        "county",
        "till",
        "paystack_subaccount_code",
        "owner__email",
        "attendant_phone",
    )
    readonly_fields = ("created_at", "updated_at")
    raw_id_fields = ("owner",)
    list_select_related = ("owner",)

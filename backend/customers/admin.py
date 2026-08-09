from django.contrib import admin

from .models import CustomerAccount, OTPVerification


@admin.register(CustomerAccount)
class CustomerAccountAdmin(admin.ModelAdmin):
    list_display = ("phone", "full_name", "farm_name", "farm_type", "location", "created_at")
    search_fields = ("phone", "full_name", "farm_name")
    readonly_fields = ("created_at", "updated_at")
    ordering = ("full_name", "phone")


@admin.register(OTPVerification)
class OTPVerificationAdmin(admin.ModelAdmin):
    list_display = ("phone_number", "attempts_count", "is_used", "expires_at", "created_at")
    list_filter = ("is_used",)
    search_fields = ("phone_number",)
    # otp_code_hash is a password hash; never editable, and the whole row is
    # audit-only from the admin's perspective.
    readonly_fields = ("phone_number", "otp_code_hash", "expires_at", "attempts_count", "is_used", "created_at")

    def has_add_permission(self, request) -> bool:
        return False

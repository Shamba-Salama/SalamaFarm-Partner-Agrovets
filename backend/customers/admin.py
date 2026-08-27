from django.contrib import admin

from .models import CustomerAccount, OTPVerification, PasswordResetToken


@admin.register(CustomerAccount)
class CustomerAccountAdmin(admin.ModelAdmin):
    list_display = (
        "email",
        "phone",
        "full_name",
        "auth_provider",
        "is_org_account",
        "org_role",
        "location",
        "created_at",
    )
    list_filter = ("auth_provider", "is_org_account", "org_role")
    search_fields = ("email", "phone", "full_name", "farm_name")
    readonly_fields = ("created_at", "updated_at", "password", "google_sub")
    ordering = ("full_name", "email", "phone")


@admin.register(OTPVerification)
class OTPVerificationAdmin(admin.ModelAdmin):
    list_display = ("phone_number", "attempts_count", "is_used", "expires_at", "created_at")
    list_filter = ("is_used",)
    search_fields = ("phone_number",)
    readonly_fields = (
        "phone_number",
        "otp_code_hash",
        "expires_at",
        "attempts_count",
        "is_used",
        "created_at",
    )

    def has_add_permission(self, request) -> bool:
        return False


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ("email", "attempts_count", "is_used", "expires_at", "created_at")
    list_filter = ("is_used",)
    search_fields = ("email",)
    readonly_fields = (
        "email",
        "code_hash",
        "expires_at",
        "attempts_count",
        "is_used",
        "created_at",
    )

    def has_add_permission(self, request) -> bool:
        return False

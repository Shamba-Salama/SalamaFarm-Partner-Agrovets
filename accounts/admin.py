from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import VendorUser


@admin.register(VendorUser)
class VendorUserAdmin(BaseUserAdmin):
    ordering = ("email",)
    list_display = ("email", "phone", "is_staff", "is_active", "created_at")
    list_filter = ("is_staff", "is_active", "is_superuser")
    search_fields = ("email", "phone", "first_name", "last_name")
    readonly_fields = ("created_at", "date_joined", "last_login")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal", {"fields": ("first_name", "last_name", "phone")}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined", "created_at")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "phone",
                    "password1",
                    "password2",
                    "is_staff",
                    "is_superuser",
                ),
            },
        ),
    )
    filter_horizontal = ("groups", "user_permissions")

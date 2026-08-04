from django.contrib import admin

from .models import ChatMessage, Thread


class ChatMessageInline(admin.TabularInline):
    model = ChatMessage
    extra = 1
    readonly_fields = ("created_at",)
    ordering = ("created_at",)


@admin.register(Thread)
class ThreadAdmin(admin.ModelAdmin):
    list_display = (
        "topic",
        "customer",
        "store",
        "channel",
        "unread",
        "updated_at",
    )
    list_filter = ("channel", "store")
    search_fields = (
        "topic",
        "customer__name",
        "customer__phone",
        "store__name",
    )
    readonly_fields = ("created_at", "updated_at")
    raw_id_fields = ("store", "customer")
    list_select_related = ("store", "customer")
    inlines = [ChatMessageInline]


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    """Standalone list for inspection; prefer editing via Thread inline."""

    list_display = ("id", "thread", "sender", "short_text", "created_at")
    list_filter = ("sender", "thread__store")
    search_fields = ("text", "thread__topic", "thread__customer__name")
    readonly_fields = ("created_at",)
    raw_id_fields = ("thread",)
    list_select_related = ("thread", "thread__customer")

    @admin.display(description="text")
    def short_text(self, obj: ChatMessage) -> str:
        return obj.text if len(obj.text) <= 60 else f"{obj.text[:57]}..."

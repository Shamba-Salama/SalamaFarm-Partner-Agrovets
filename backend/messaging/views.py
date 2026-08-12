"""Store-scoped messaging API — threads and store-sent messages."""

from django.db.models import OuterRef, Subquery
from django.utils import timezone
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.tenancy import get_vendor_store

from .models import ChatMessage, Thread
from .serializers import (
    ChatMessageSerializer,
    StoreMessageCreateSerializer,
    ThreadCreateSerializer,
    ThreadDetailSerializer,
    ThreadListSerializer,
)


class ThreadViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """
    Threads for the authenticated vendor's store.

    Store-sent messages never bump `unread`. Farmer-sent messages bump
    `unread` via the customer marketplace API (/api/v1/marketplace/threads/).
    Cross-tenant ids → 404.
    """

    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_store(self):
        return get_vendor_store(self.request.user)

    def get_queryset(self):
        store = self.get_store()
        latest = ChatMessage.objects.filter(thread_id=OuterRef("pk")).order_by("-created_at")
        return (
            Thread.objects.for_store(store)
            .select_related("customer")
            .annotate(
                last_message_id=Subquery(latest.values("id")[:1]),
                last_message_sender=Subquery(latest.values("sender")[:1]),
                last_message_text=Subquery(latest.values("text")[:1]),
                last_message_at=Subquery(latest.values("created_at")[:1]),
            )
        )

    def get_serializer_class(self):
        if self.action == "create":
            return ThreadCreateSerializer
        if self.action == "retrieve":
            return ThreadDetailSerializer
        if self.action == "messages":
            return StoreMessageCreateSerializer
        return ThreadListSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["store"] = self.get_store()
        return ctx

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        thread = serializer.save()
        thread = self.get_queryset().prefetch_related("messages").get(pk=thread.pk)
        return Response(
            ThreadDetailSerializer(thread, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    def retrieve(self, request, *args, **kwargs):
        thread = self.get_object()
        # ensure messages oldest-first
        thread = (
            Thread.objects.for_store(self.get_store())
            .select_related("customer")
            .prefetch_related("messages")
            .get(pk=thread.pk)
        )
        return Response(ThreadDetailSerializer(thread, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="messages")
    def messages(self, request, pk=None):
        thread = self.get_object()
        serializer = StoreMessageCreateSerializer(
            data=request.data,
            context={"request": request, "thread": thread, "store": self.get_store()},
        )
        serializer.is_valid(raise_exception=True)
        msg = serializer.save()
        # Store replies do not increment unread; refresh updated_at only.
        Thread.objects.filter(pk=thread.pk).update(updated_at=timezone.now())
        thread.refresh_from_db(fields=["unread", "updated_at"])
        return Response(
            {
                "message": ChatMessageSerializer(msg).data,
                "thread": {
                    "id": thread.id,
                    "unread": thread.unread,
                    "updated_at": thread.updated_at,
                },
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path="mark-read")
    def mark_read(self, request, pk=None):
        thread = self.get_object()
        thread.unread = 0
        thread.save(update_fields=["unread", "updated_at"])
        return Response(
            {
                "id": thread.id,
                "unread": thread.unread,
                "updated_at": thread.updated_at,
            }
        )

"""Customer-app marketplace messaging — farmer ↔ store threads."""

from django.db.models import OuterRef, Subquery
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from customers.authentication import CustomerJWTAuthentication
from customers.permissions import IsAuthenticatedCustomer

from .marketplace_serializers import (
    MarketplaceFarmerMessageCreateSerializer,
    MarketplaceThreadCreateSerializer,
    MarketplaceThreadDetailSerializer,
    MarketplaceThreadListSerializer,
)
from .models import ChatMessage, Thread
from .serializers import ChatMessageSerializer


class MarketplaceThreadViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """
    Customer-scoped threads under /api/v1/marketplace/threads/.

    Farmer messages bump Thread.unread for the vendor inbox; store replies
    use the vendor /api/v1/threads/ endpoints and do not bump unread.
    """

    authentication_classes = [CustomerJWTAuthentication]
    permission_classes = [IsAuthenticatedCustomer]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        latest = ChatMessage.objects.filter(thread_id=OuterRef("pk")).order_by(
            "-created_at"
        )
        return (
            Thread.objects.filter(customer__account=self.request.user)
            .select_related("store", "customer")
            .annotate(
                last_message_id=Subquery(latest.values("id")[:1]),
                last_message_sender=Subquery(latest.values("sender")[:1]),
                last_message_text=Subquery(latest.values("text")[:1]),
                last_message_at=Subquery(latest.values("created_at")[:1]),
            )
            .order_by("-updated_at")
        )

    def get_serializer_class(self):
        if self.action == "create":
            return MarketplaceThreadCreateSerializer
        if self.action == "retrieve":
            return MarketplaceThreadDetailSerializer
        if self.action == "messages":
            return MarketplaceFarmerMessageCreateSerializer
        return MarketplaceThreadListSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["account"] = self.request.user
        return ctx

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        thread = serializer.save()
        thread = self.get_queryset().prefetch_related("messages").get(pk=thread.pk)
        return Response(
            MarketplaceThreadDetailSerializer(thread, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    def retrieve(self, request, *args, **kwargs):
        thread = self.get_object()
        thread = (
            self.get_queryset()
            .prefetch_related("messages")
            .get(pk=thread.pk)
        )
        return Response(
            MarketplaceThreadDetailSerializer(thread, context={"request": request}).data
        )

    @action(detail=True, methods=["post"], url_path="messages")
    def messages(self, request, pk=None):
        thread = self.get_object()
        serializer = MarketplaceFarmerMessageCreateSerializer(
            data=request.data,
            context={"request": request, "thread": thread, "account": request.user},
        )
        serializer.is_valid(raise_exception=True)
        msg = serializer.save()
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

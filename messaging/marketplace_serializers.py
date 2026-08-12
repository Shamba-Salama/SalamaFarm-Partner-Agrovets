"""Customer-app marketplace messaging serializers."""

from django.db import transaction
from django.db.models import F
from django.utils import timezone
from rest_framework import serializers

from crm.customer_resolution import resolve_marketplace_customer
from stores.models import AgrovetStore

from .models import ChatMessage, Thread
from .serializers import ChatMessageSerializer, ThreadListSerializer


class MarketplaceThreadListSerializer(ThreadListSerializer):
    """Thread row for the customer inbox — includes store context."""

    store_id = serializers.IntegerField(read_only=True)
    store_name = serializers.CharField(source="store.name", read_only=True)

    class Meta(ThreadListSerializer.Meta):
        fields = (
            "id",
            "store_id",
            "store_name",
            "customer",
            "channel",
            "topic",
            "unread",
            "last_message",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class MarketplaceThreadDetailSerializer(MarketplaceThreadListSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta(MarketplaceThreadListSerializer.Meta):
        fields = MarketplaceThreadListSerializer.Meta.fields + ("messages",)


class MarketplaceThreadCreateSerializer(serializers.Serializer):
    store_id = serializers.IntegerField()
    topic = serializers.CharField(max_length=160)
    message = serializers.CharField()

    def validate_store_id(self, value: int) -> int:
        if not AgrovetStore.objects.filter(pk=value, open=True).exists():
            raise serializers.ValidationError(
                "Store not found or not available for messaging."
            )
        return value

    def validate_message(self, value: str) -> str:
        text = (value or "").strip()
        if not text:
            raise serializers.ValidationError("Message cannot be empty.")
        return text

    @transaction.atomic
    def create(self, validated_data):
        account = self.context["account"]
        store = AgrovetStore.objects.get(pk=validated_data["store_id"])
        customer = resolve_marketplace_customer(store, account)
        topic = validated_data["topic"].strip()
        text = validated_data["message"]

        thread = Thread.objects.create(
            store=store,
            customer=customer,
            topic=topic,
            channel=Thread.Channel.IN_APP,
            unread=0,
        )
        ChatMessage.objects.create(
            thread=thread,
            sender=ChatMessage.Sender.FARMER,
            text=text,
        )
        Thread.objects.filter(pk=thread.pk).update(
            unread=F("unread") + 1,
            updated_at=timezone.now(),
        )
        thread.refresh_from_db()
        return thread


class MarketplaceFarmerMessageCreateSerializer(serializers.Serializer):
    text = serializers.CharField()

    def validate_text(self, value: str) -> str:
        text = (value or "").strip()
        if not text:
            raise serializers.ValidationError("Message cannot be empty.")
        return text

    @transaction.atomic
    def create(self, validated_data):
        thread: Thread = self.context["thread"]
        msg = ChatMessage.objects.create(
            thread=thread,
            sender=ChatMessage.Sender.FARMER,
            text=validated_data["text"],
        )
        Thread.objects.filter(pk=thread.pk).update(
            unread=F("unread") + 1,
            updated_at=timezone.now(),
        )
        thread.refresh_from_db(fields=["unread", "updated_at"])
        return msg

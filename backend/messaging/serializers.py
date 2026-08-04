"""Messaging serializers — threads and chat messages."""

from django.db import transaction
from rest_framework import serializers

from crm.models import Customer
from crm.serializers import CustomerNestedSerializer

from .models import ChatMessage, Thread


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ("id", "sender", "text", "created_at")
        read_only_fields = fields


class ThreadListSerializer(serializers.ModelSerializer):
    customer = CustomerNestedSerializer(read_only=True)
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Thread
        fields = (
            "id",
            "customer",
            "channel",
            "topic",
            "unread",
            "last_message",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_last_message(self, obj: Thread) -> dict | None:
        # Prefer annotation from the list queryset when present
        if getattr(obj, "last_message_id", None):
            text = obj.last_message_text or ""
            preview = text if len(text) <= 120 else f"{text[:117]}..."
            return {
                "id": obj.last_message_id,
                "sender": obj.last_message_sender,
                "text": preview,
                "created_at": obj.last_message_at,
            }
        msg = obj.messages.order_by("-created_at").first()
        if not msg:
            return None
        text = msg.text
        preview = text if len(text) <= 120 else f"{text[:117]}..."
        return {
            "id": msg.id,
            "sender": msg.sender,
            "text": preview,
            "created_at": msg.created_at,
        }


class ThreadDetailSerializer(ThreadListSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta(ThreadListSerializer.Meta):
        fields = ThreadListSerializer.Meta.fields + ("messages",)


class ThreadCreateSerializer(serializers.Serializer):
    customer_id = serializers.IntegerField()
    topic = serializers.CharField(max_length=160)
    message = serializers.CharField(required=False, allow_blank=False)
    channel = serializers.ChoiceField(
        choices=Thread.Channel.choices,
        default=Thread.Channel.IN_APP,
        required=False,
    )

    def validate_customer_id(self, value: int) -> int:
        store = self.context["store"]
        if not Customer.objects.for_store(store).filter(pk=value).exists():
            raise serializers.ValidationError("Customer not found for this store.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        store = self.context["store"]
        customer = Customer.objects.for_store(store).get(pk=validated_data["customer_id"])
        first_text = validated_data.pop("message", None)
        thread = Thread.objects.create(
            store=store,
            customer=customer,
            topic=validated_data["topic"].strip(),
            channel=validated_data.get("channel", Thread.Channel.IN_APP),
            unread=0,
        )
        if first_text:
            ChatMessage.objects.create(
                thread=thread,
                sender=ChatMessage.Sender.STORE,
                text=first_text.strip(),
            )
            # touch updated_at
            thread.save(update_fields=["updated_at"])
        return thread


class StoreMessageCreateSerializer(serializers.Serializer):
    text = serializers.CharField()

    def create(self, validated_data):
        thread: Thread = self.context["thread"]
        return ChatMessage.objects.create(
            thread=thread,
            sender=ChatMessage.Sender.STORE,
            text=validated_data["text"].strip(),
        )

"""Messaging models — farmer ↔ store chat threads."""

from django.db import models

from core.models import BaseStoreOwnedModel


class Thread(BaseStoreOwnedModel):
    """Conversation between a store and a customer."""

    class Channel(models.TextChoices):
        IN_APP = "in-app", "in-app"
        OFFLINE_SMS = "offline-sms", "offline-sms"

    customer = models.ForeignKey(
        "crm.Customer",
        on_delete=models.CASCADE,
        related_name="threads",
    )
    channel = models.CharField(max_length=20, choices=Channel.choices)
    topic = models.CharField(max_length=160)
    unread = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        verbose_name = "thread"
        verbose_name_plural = "threads"

    def __str__(self) -> str:
        return f"{self.topic} — {self.customer}"


class ChatMessage(models.Model):
    """Single message in a thread (scoped via thread.store)."""

    class Sender(models.TextChoices):
        FARMER = "farmer", "farmer"
        STORE = "store", "store"

    thread = models.ForeignKey(
        Thread,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.CharField(max_length=10, choices=Sender.choices)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        verbose_name = "chat message"
        verbose_name_plural = "chat messages"

    def __str__(self) -> str:
        preview = self.text if len(self.text) <= 40 else f"{self.text[:37]}..."
        return f"{self.sender}: {preview}"

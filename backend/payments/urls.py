from django.urls import path

from .views import ChargeView, PaystackWebhookView

urlpatterns = [
    path("payments/charge/", ChargeView.as_view(), name="payments-charge"),
]

webhook_urlpatterns = [
    path("paystack/webhook/", PaystackWebhookView.as_view(), name="paystack-webhook"),
]

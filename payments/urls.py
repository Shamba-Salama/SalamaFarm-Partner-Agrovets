from django.urls import path

from .views import ChargeView, CustomerChargeView, PaystackWebhookView

urlpatterns = [
    path("payments/charge/", ChargeView.as_view(), name="payments-charge"),
    path(
        "payments/customer-charge/",
        CustomerChargeView.as_view(),
        name="payments-customer-charge",
    ),
]

webhook_urlpatterns = [
    path("paystack/webhook/", PaystackWebhookView.as_view(), name="paystack-webhook"),
]

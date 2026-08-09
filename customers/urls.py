from django.urls import path

from .views import (
    CustomerMeView,
    CustomerTokenRefreshView,
    RequestOTPView,
    VerifyOTPView,
)

urlpatterns = [
    path("request-otp/", RequestOTPView.as_view(), name="customer-request-otp"),
    path("verify-otp/", VerifyOTPView.as_view(), name="customer-verify-otp"),
    path("me/", CustomerMeView.as_view(), name="customer-me"),
    path("token/refresh/", CustomerTokenRefreshView.as_view(), name="customer-token-refresh"),
]

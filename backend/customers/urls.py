from django.urls import path

from .views import (
    CustomerGoogleAuthView,
    CustomerLoginView,
    CustomerMeView,
    CustomerRegisterView,
    CustomerTokenRefreshView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    RequestOTPView,
    VerifyOTPView,
)

urlpatterns = [
    path("register/", CustomerRegisterView.as_view(), name="customer-register"),
    path("login/", CustomerLoginView.as_view(), name="customer-login"),
    path("google/", CustomerGoogleAuthView.as_view(), name="customer-google"),
    path(
        "password-reset/request/",
        PasswordResetRequestView.as_view(),
        name="customer-password-reset-request",
    ),
    path(
        "password-reset/confirm/",
        PasswordResetConfirmView.as_view(),
        name="customer-password-reset-confirm",
    ),
    path("request-otp/", RequestOTPView.as_view(), name="customer-request-otp"),
    path("verify-otp/", VerifyOTPView.as_view(), name="customer-verify-otp"),
    path("me/", CustomerMeView.as_view(), name="customer-me"),
    path("token/refresh/", CustomerTokenRefreshView.as_view(), name="customer-token-refresh"),
]

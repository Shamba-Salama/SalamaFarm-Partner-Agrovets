from django.urls import path

from .views import (
    EmailTokenObtainPairView,
    EmailTokenRefreshView,
    ForgotPasswordView,
    MeView,
    RecoverSessionView,
    RegisterView,
    ResetPasswordView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("token/", EmailTokenObtainPairView.as_view(), name="auth-token"),
    path("token/refresh/", EmailTokenRefreshView.as_view(), name="auth-token-refresh"),
    path("forgot-password/", ForgotPasswordView.as_view(), name="auth-forgot-password"),
    path("recover-session/", RecoverSessionView.as_view(), name="auth-recover-session"),
    path("reset-password/", ResetPasswordView.as_view(), name="auth-reset-password"),
    path("me/", MeView.as_view(), name="auth-me"),
]

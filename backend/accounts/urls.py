from django.urls import path

from .views import EmailTokenObtainPairView, EmailTokenRefreshView, MeView, RegisterView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("token/", EmailTokenObtainPairView.as_view(), name="auth-token"),
    path("token/refresh/", EmailTokenRefreshView.as_view(), name="auth-token-refresh"),
    path("me/", MeView.as_view(), name="auth-me"),
]

"""URL configuration for the SalamaFarm Partner Agrovets API."""

from django.contrib import admin
from django.urls import include, path

from payments.urls import webhook_urlpatterns

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("accounts.urls")),
    path("api/v1/customer-auth/", include("customers.urls")),
    path("api/v1/store/", include("stores.urls")),
    path("api/v1/", include("catalog.urls")),
    path("api/v1/", include("crm.urls")),
    path("api/v1/", include("messaging.urls")),
    path("api/v1/", include("payments.urls")),
    path("api/", include(webhook_urlpatterns)),
]

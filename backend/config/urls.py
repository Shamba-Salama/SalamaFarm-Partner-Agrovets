"""URL configuration for the SalamaFarm Partner Agrovets API."""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from payments.urls import webhook_urlpatterns
from visits.views import AppVisitsAnalyticsView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("accounts.urls")),
    path("api/v1/customer-auth/", include("customers.urls")),
    path("api/v1/store/", include("stores.urls")),
    path("api/v1/", include("catalog.urls")),
    path("api/v1/", include("crm.urls")),
    path("api/v1/marketplace/", include("messaging.marketplace_urls")),
    path("api/v1/marketplace/", include("visits.marketplace_urls")),
    path("api/v1/", include("messaging.urls")),
    path("api/v1/", include("payments.urls")),
    path(
        "api/v1/analytics/app-visits/",
        AppVisitsAnalyticsView.as_view(),
        name="app-visits",
    ),
    path("api/", include(webhook_urlpatterns)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

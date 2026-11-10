"""URL configuration for the SalamaFarm Partner Agrovets API."""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path

from visits.views import AppVisitsAnalyticsView
from core.health import health, ready, root


def api_root(_request):
    return JsonResponse(
        {
            "ok": True,
            "service": "SalamaFarm Partner Agrovets API",
            "api": "/api/v1/",
            "admin": "/admin/",
        }
    )


urlpatterns = [
    path("", root, name="root"),
    path("api/v1/", api_root, name="api-v1-root"),
    path("admin/", admin.site.urls),
    path("api/upload-url/", include("core.urls")),
    path("api/v1/auth/", include("accounts.urls")),
    path("api/v1/customer-auth/", include("customers.urls")),
    path("api/v1/store/", include("stores.urls")),
    path("api/v1/", include("catalog.urls")),
    path("api/v1/", include("crm.urls")),
    path("api/v1/marketplace/", include("messaging.marketplace_urls")),
    path("api/v1/marketplace/", include("visits.marketplace_urls")),
    path("api/v1/", include("messaging.urls")),
    path(
        "api/v1/analytics/app-visits/",
        AppVisitsAnalyticsView.as_view(),
        name="app-visits",
    ),
    # Health endpoints for liveness/readiness probes
    path("health/", health, name="health"),
    path("health.json", health, name="health-json"),
    path("ready/", ready, name="ready"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

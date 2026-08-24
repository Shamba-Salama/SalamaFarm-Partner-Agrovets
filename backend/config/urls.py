"""URL configuration for the SalamaFarm Partner Agrovets API."""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path

from core.health import health, ready, root
from payments.urls import webhook_urlpatterns
from visits.views import AppVisitsAnalyticsView


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
    # API root response for Render/browser checks
    path("", api_root, name="api-root"),
    path("api/v1/", api_root, name="api-v1-root"),

    # Health and readiness checks
    path("health/", health, name="health"),
    path("ready/", ready, name="ready"),

    # Admin
    path("admin/", admin.site.urls),

    # Authentication
    path("api/v1/auth/", include("accounts.urls")),
    path("api/v1/customer-auth/", include("customers.urls")),

    # Store and catalog
    path("api/v1/store/", include("stores.urls")),
    path("api/v1/", include("catalog.urls")),

    # CRM
    path("api/v1/", include("crm.urls")),

    # Marketplace
    path(
        "api/v1/marketplace/",
        include("messaging.marketplace_urls"),
    ),
    path(
        "api/v1/marketplace/",
        include("visits.marketplace_urls"),
    ),

    # Messaging and payments
    path("api/v1/", include("messaging.urls")),
    path("api/v1/", include("payments.urls")),

    # Analytics
    path(
        "api/v1/analytics/app-visits/",
        AppVisitsAnalyticsView.as_view(),
        name="app-visits",
    ),

    # Payment webhooks
    path("api/", include(webhook_urlpatterns)),

    # Health endpoints for liveness/readiness probes
    path("health/", health, name="health"),
    path("health.json", health, name="health-json"),
    path("ready/", ready, name="ready"),

]


if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )
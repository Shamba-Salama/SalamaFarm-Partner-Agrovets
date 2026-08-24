from django.http import JsonResponse
from django.db import connections
from django.db.utils import OperationalError


def root(request):
    """Browser landing for the API host. GET / used to 404 with no homepage."""
    return JsonResponse(
        {
            "service": "SalamaFarm Partner Agrovets API",
            "status": "ok",
            "health": "/health/",
            "admin": "/admin/",
            "api": "/api/v1/",
        }
    )


def health(request):
    """Lightweight liveness probe."""
    return JsonResponse({"status": "ok"})


def ready(request):
    """Readiness probe: verifies DB connectivity."""
    try:
        conn = connections["default"]
        with conn.cursor() as cursor:
            cursor.execute("SELECT 1")
        return JsonResponse({"ready": True})
    except OperationalError:
        return JsonResponse({"ready": False}, status=503)

from django.http import HttpResponse, JsonResponse
from django.db import connections
from django.db.utils import OperationalError


_LANDING_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>SalamaFarm API</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 40rem; margin: 3rem auto; padding: 0 1.25rem; color: #14281d; background: #f6f8f6; }
    h1 { font-size: 1.4rem; }
    a { color: #1b7a3d; }
    code, .box { background: #fff; border: 1px solid #d7ddd8; border-radius: 8px; padding: 0.75rem 1rem; display: block; }
    ul { line-height: 1.7; }
  </style>
</head>
<body>
  <h1>SalamaFarm Partner Agrovets API</h1>
  <p>The backend is running. This host is the JSON API, not the vendor portal website.</p>
  <p class="box">Status: <strong>ok</strong></p>
  <ul>
    <li><a href="/health.json">/health.json</a> — same check, uncached path</li>
    <li><a href="/admin/">/admin/</a> — Django admin</li>
    <li><a href="/api/v1/marketplace/products/">/api/v1/marketplace/products/</a> — public catalog</li>
  </ul>
</body>
</html>
"""


def _no_store(response):
    response["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response["Pragma"] = "no-cache"
    return response


def root(request):
    """Browser landing for the API host."""
    accept = request.headers.get("Accept", "")
    if "text/html" in accept:
        return _no_store(HttpResponse(_LANDING_HTML))
    return _no_store(
        JsonResponse(
            {
                "service": "SalamaFarm Partner Agrovets API",
                "status": "ok",
                "engine": "django",
                "health": "/health/",
                "admin": "/admin/",
                "api": "/api/v1/",
            }
        )
    )


def health(request):
    """Lightweight liveness probe."""
    return _no_store(JsonResponse({"status": "ok", "engine": "django"}))


def ready(request):
    """Readiness probe: verifies DB connectivity."""
    try:
        conn = connections["default"]
        with conn.cursor() as cursor:
            cursor.execute("SELECT 1")
        return JsonResponse({"ready": True})
    except OperationalError:
        return JsonResponse({"ready": False}, status=503)

# ──────────────────────────────────────────────────────────────────────────────
# Default image for this repo (Render, GHCR backend, local `docker build .`)
# Django API from backend/. Not the nginx frontend.
# ──────────────────────────────────────────────────────────────────────────────

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=config.settings.prod

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq-dev \
        gcc \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

COPY backend/ .

RUN addgroup --system django && adduser --system --ingroup django django \
 && mkdir -p /app/staticfiles /app/media \
 && chown -R django:django /app

USER django

EXPOSE 8000

CMD ["sh", "-c", \
     "python manage.py migrate --noinput && \
      python manage.py collectstatic --noinput && \
      gunicorn config.wsgi:application \
        --bind 0.0.0.0:${PORT:-8000} \
        --workers 2 \
        --timeout 120 \
        --access-logfile - \
        --error-logfile -"]

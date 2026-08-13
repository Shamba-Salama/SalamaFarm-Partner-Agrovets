# ──────────────────────────────────────────────────────────────────────────────
# SalamaFarm Partner Agrovets — Django backend
# Python 3.12 + gunicorn
# ──────────────────────────────────────────────────────────────────────────────

FROM python:3.12-slim

# Keeps Python from generating .pyc files and buffers stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System-level deps for psycopg2-binary and Pillow
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq-dev \
        gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (layer-caching)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt \
 && pip install --no-cache-dir gunicorn==23.0.0

# Copy project source
COPY . .

# Create a non-root user and own the app directory
RUN addgroup --system django && adduser --system --ingroup django django \
 && chown -R django:django /app

# Create directories gunicorn and Django need at runtime
RUN mkdir -p /app/staticfiles /app/media \
 && chown -R django:django /app/staticfiles /app/media

USER django

EXPOSE 8000

# collect static at container start (harmless on re-runs; fast with the
# staticfiles already present from a prior run because it uses caching)
CMD ["sh", "-c", \
     "python manage.py migrate --noinput && \
      python manage.py collectstatic --noinput && \
      gunicorn config.wsgi:application \
        --bind 0.0.0.0:8000 \
        --workers 4 \
        --timeout 120 \
        --access-logfile - \
        --error-logfile -"]

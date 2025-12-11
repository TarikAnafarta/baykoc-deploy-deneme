# Backend Dockerfile (context: ./backend)
FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app

RUN apt-get update && apt-get install -y \
    postgresql-client \
    gcc \
    python3-dev \
    musl-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r /app/requirements.txt

# Copy backend project files
COPY . /app/

# Create necessary directories
RUN mkdir -p /app/staticfiles /app/media /app/backups

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

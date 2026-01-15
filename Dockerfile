# Stage 1: Build and pre-download models
FROM python:3.11-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml .
RUN pip install --no-cache-dir .

# Set cache directories for model pre-loading
ENV TRANSFORMERS_CACHE=/app/.cache/huggingface
ENV SENTENCE_TRANSFORMERS_HOME=/app/.cache/sentence-transformers
ENV HF_HOME=/app/.cache/huggingface

# Pre-download all embedding models
COPY scripts/preload_models.py .
RUN python preload_models.py

# Stage 2: Runtime image
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml .
RUN pip install --no-cache-dir .

COPY src/ src/

# Copy pre-downloaded models from builder
COPY --from=builder /app/.cache /app/.cache

ENV PYTHONPATH=/app/src
ENV PYTHONUNBUFFERED=1
ENV TRANSFORMERS_CACHE=/app/.cache/huggingface
ENV SENTENCE_TRANSFORMERS_HOME=/app/.cache/sentence-transformers
ENV HF_HOME=/app/.cache/huggingface

EXPOSE 8000

CMD ["uvicorn", "recall.main:app", "--host", "0.0.0.0", "--port", "8000"]

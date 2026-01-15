<p align="center">
  <h1 align="center">Recall</h1>
  <p align="center">
    <strong>A Generic Multimodal Semantic Search Engine</strong>
  </p>
  <p align="center">
    <a href="#features">Features</a> •
    <a href="#quick-start">Quick Start</a> •
    <a href="#api-reference">API</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#development">Development</a>
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/python-3.11+-blue.svg" alt="Python 3.11+">
  <img src="https://img.shields.io/badge/FastAPI-0.115+-green.svg" alt="FastAPI">
  <img src="https://img.shields.io/badge/Pydantic-v2-orange.svg" alt="Pydantic v2">
  <img src="https://img.shields.io/badge/Vector%20DB-Qdrant-red.svg" alt="Qdrant">
  <img src="https://img.shields.io/badge/coverage-72%25-yellowgreen.svg" alt="Coverage">
  <img src="https://img.shields.io/badge/license-MIT-lightgrey.svg" alt="License">
</p>

---

## Overview

**Recall** is a schema-agnostic semantic search engine designed for multimodal data. Unlike vertical search solutions, Recall allows you to dynamically define schemas, choose embedding models, and perform hybrid searches across arbitrary collections.

```python
# Create a collection with your schema
POST /v1/collections
{
  "name": "products",
  "embedding_config": { "model": "clip-ViT-B-32", "modality": "image" },
  "index_schema": { "price": "float", "category": "keyword" }
}

# Search with natural language + filters
POST /v1/collections/products/search
{
  "query": "red running shoes",
  "filter": { "op": "LT", "field": "price", "value": 150 },
  "limit": 10
}
```

## Features

- **Schema-on-Write** — Define collection schemas dynamically at creation time
- **Dynamic Schema Enforcement** — Payloads validated against schema before ingestion (422 on mismatch)
- **Multimodal Support** — Text and image embeddings with pluggable models
- **Hybrid Search** — Combine semantic similarity with structured filters
- **Async Pipeline** — Non-blocking ingestion with background workers and status polling
- **Idempotent Ingestion** — Deterministic vector IDs ensure re-ingestion updates rather than duplicates
- **Filter DSL** — Expressive query language that transpiles to native DB filters
- **Production Ready** — Typed errors, health checks, model baking, and Docker support

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Clone and start all services
git clone https://github.com/fr0ziii/recall.git
cd recall
docker compose up -d

# API available at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

- Compose includes healthchecks/restart policies; api/worker/ui wait for healthy Redis and Qdrant (pinned to `qdrant/qdrant:1.12.4`).

### Local Development

```bash
# Prerequisites: Redis and Qdrant running locally
# Install: brew install redis && brew services start redis
# Qdrant: docker run -p 6333:6333 qdrant/qdrant

# Install dependencies (using uv - recommended)
uv sync --all-extras

# Or using pip
pip install -e ".[dev]"

# Start the API server
PYTHONPATH=src uvicorn recall.main:app --reload

# In another terminal, start the worker
PYTHONPATH=src arq recall.workers.tasks.WorkerSettings
```

### Verify Installation

```bash
curl http://localhost:8000/health
# {"status": "healthy"}

curl http://localhost:8000/v1/collections/models/supported
# ["all-MiniLM-L6-v2", "all-mpnet-base-v2", "clip-ViT-B-32", ...]
```

## Usage

### 1. Create a Collection

```bash
curl -X POST http://localhost:8000/v1/collections \
  -H "Content-Type: application/json" \
  -d '{
    "name": "articles",
    "embedding_config": {
      "model": "all-MiniLM-L6-v2",
      "modality": "text"
    },
    "index_schema": {
      "author": "keyword",
      "published": "bool",
      "views": "int"
    }
  }'
```

### 2. Ingest Documents

```bash
curl -X POST http://localhost:8000/v1/collections/articles/documents \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "id": "doc-001",
        "content_raw": "Introduction to machine learning and neural networks",
        "payload": { "author": "jane_doe", "published": true, "views": 1500 }
      },
      {
        "id": "doc-002",
        "content_raw": "Advanced deep learning techniques for NLP",
        "payload": { "author": "john_smith", "published": true, "views": 3200 }
      }
    ]
  }'
# Returns: { "task_id": "...", "documents_queued": 2, "status": "queued" }
```

### 3. Poll Task Status (Optional)

```bash
curl http://localhost:8000/v1/tasks/{task_id}
# Returns: { "task_id": "...", "jobs": [...], "summary": { "total": 2, "complete": 2, ... } }
```

### 4. Search

```bash
curl -X POST http://localhost:8000/v1/collections/articles/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "neural network tutorials",
    "filter": {
      "op": "AND",
      "conditions": [
        { "op": "EQ", "field": "published", "value": true },
        { "op": "GT", "field": "views", "value": 1000 }
      ]
    },
    "limit": 5
  }'
```

## API Reference

### Collections

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/collections` | Create a new collection |
| `GET` | `/v1/collections` | List all collection names |
| `GET` | `/v1/collections/{name}` | Get collection configuration |
| `DELETE` | `/v1/collections/{name}` | Delete collection and data |

### Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/collections/{name}/documents` | Queue documents for ingestion (validates payload against schema) |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/v1/tasks/{task_id}` | Poll async ingestion task status |

### Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/collections/{name}/search` | Semantic search with filters |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/v1/collections/models/supported` | List supported models |

> 📖 **Interactive API docs available at** `/docs` **(Swagger UI)** or `/redoc`

## Filter DSL

Recall provides an expressive filter DSL that gets transpiled to native Qdrant filters:

```json
{
  "op": "AND",
  "conditions": [
    { "op": "EQ", "field": "category", "value": "electronics" },
    { "op": "LTE", "field": "price", "value": 500 },
    {
      "op": "OR",
      "conditions": [
        { "op": "EQ", "field": "brand", "value": "Apple" },
        { "op": "EQ", "field": "brand", "value": "Samsung" }
      ]
    }
  ]
}
```

### Supported Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `EQ` | Equals | `{"op": "EQ", "field": "status", "value": "active"}` |
| `NEQ` | Not equals | `{"op": "NEQ", "field": "status", "value": "deleted"}` |
| `LT` | Less than | `{"op": "LT", "field": "price", "value": 100}` |
| `LTE` | Less than or equal | `{"op": "LTE", "field": "price", "value": 100}` |
| `GT` | Greater than | `{"op": "GT", "field": "rating", "value": 4.0}` |
| `GTE` | Greater than or equal | `{"op": "GTE", "field": "rating", "value": 4.0}` |
| `IN` | In list | `{"op": "IN", "field": "tag", "value": ["sale", "new"]}` |
| `AND` | Logical AND | Combines multiple conditions |
| `OR` | Logical OR | Matches any condition |

## Supported Models

### Text Embeddings

| Model | Dimensions | Use Case |
|-------|------------|----------|
| `all-MiniLM-L6-v2` | 384 | Fast, general-purpose (default) |
| `all-mpnet-base-v2` | 768 | Higher quality, slower |
| `paraphrase-MiniLM-L6-v2` | 384 | Paraphrase detection |
| `multi-qa-MiniLM-L6-cos-v1` | 384 | Question-answering |

### Image Embeddings

| Model | Dimensions | Use Case |
|-------|------------|----------|
| `clip-ViT-B-32` | 512 | Fast, general-purpose (default) |
| `clip-ViT-B-16` | 512 | Better quality |
| `clip-ViT-L-14` | 768 | Highest quality, slowest |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Request                          │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FastAPI Gateway                             │
│  • Authentication & Validation                                  │
│  • Schema Validation (Pydantic v2)                              │
│  • Route Handling                                               │
└─────────────────────────────────────────────────────────────────┘
                                 │
                 ┌───────────────┼───────────────┐
                 ▼               ▼               ▼
          ┌──────────┐    ┌──────────┐    ┌──────────┐
          │  Search  │    │  Ingest  │    │  Admin   │
          │ Service  │    │ Service  │    │ Service  │
          └──────────┘    └──────────┘    └──────────┘
                 │               │               │
                 │               ▼               │
                 │     ┌─────────────────┐       │
                 │     │   Redis Queue   │       │
                 │     │   (Arq Tasks)   │       │
                 │     └─────────────────┘       │
                 │               │               │
                 │               ▼               │
                 │     ┌─────────────────┐       │
                 │     │    Workers      │       │
                 │     │ • Fetch Content │       │
                 │     │ • Generate Emb. │       │
                 │     └─────────────────┘       │
                 │               │               │
                 ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Data Layer                               │
│  ┌─────────────────┐              ┌─────────────────┐           │
│  │     Redis       │              │     Qdrant      │           │
│  │ • Schema Store  │              │ • Vector Store  │           │
│  │ • Task Queue    │              │ • Payload Index │           │
│  └─────────────────┘              └─────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `QDRANT_URL` | `http://localhost:6333` | Qdrant server URL |
| `DEFAULT_TEXT_MODEL` | `all-MiniLM-L6-v2` | Default text embedding model |
| `DEFAULT_IMAGE_MODEL` | `clip-ViT-B-32` | Default image embedding model |
| `API_HOST` | `0.0.0.0` | API bind host |
| `API_PORT` | `8000` | API bind port |
| `DEBUG` | `false` | Enable debug mode |

### Example `.env` File

```env
REDIS_URL=redis://localhost:6379
QDRANT_URL=http://localhost:6333
DEBUG=true
```

## Development

### Project Structure

```
recall/
├── src/recall/
│   ├── main.py                 # Application entry point
│   ├── config.py               # Configuration management
│   ├── models/                 # Pydantic schemas
│   │   ├── collection.py       # Collection models
│   │   ├── document.py         # Document models
│   │   ├── search.py           # Search & filter DSL
│   │   └── errors.py           # Typed exceptions
│   ├── core/
│   │   ├── embedders/          # Embedding implementations
│   │   ├── vectordb/           # Vector DB adapters
│   │   └── transpiler/         # DSL transpiler
│   ├── services/               # Business logic
│   ├── api/v1/                 # API endpoints
│   └── workers/                # Background tasks
├── tests/
│   ├── conftest.py             # Shared test fixtures
│   ├── unit/                   # Unit tests (models, services, core)
│   │   └── services/           # Service unit tests
│   ├── integration/            # API integration tests
│   └── performance/            # Performance benchmarks
├── docker-compose.yml
├── Dockerfile
└── pyproject.toml              # uv-compatible config
```

### Running Tests

The project includes a comprehensive test suite with 190+ tests covering unit, integration, and performance testing.

```bash
# Unit tests (fast, no external dependencies)
uv run pytest tests/unit/ -v

# Integration tests (uses mocked external services)
uv run pytest tests/integration/ -v

# All tests with coverage report
uv run pytest tests/unit/ tests/integration/ -v --cov=recall --cov-report=term-missing

# Run tests in parallel (faster)
uv run pytest tests/ -n auto

# Run by marker
uv run pytest -m "unit"           # Unit tests only
uv run pytest -m "integration"    # Integration tests only
uv run pytest -m "not slow"       # Exclude slow tests (model loading)

# Performance benchmarks
uv run pytest tests/performance/ -v -m slow
```

**Test markers:**
- `unit` - Fast unit tests with mocked dependencies
- `integration` - API integration tests with mocked Redis/Qdrant
- `slow` - Tests that load ML models (slower)

### Linting & Formatting

```bash
# Check for issues
uv run ruff check src/ tests/

# Auto-fix issues
uv run ruff check src/ tests/ --fix

# Format code
uv run ruff format src/ tests/
```

### Adding a New Embedding Model

1. Add model to `EmbedderFactory.TEXT_MODELS` or `IMAGE_MODELS`
2. Add dimensions to `MODEL_DIMENSIONS` in the respective embedder
3. The factory will automatically handle instantiation

## Deployment

### Docker Production Build

The Dockerfile uses a multi-stage build that pre-downloads all embedding models during the build phase, eliminating cold-start latency from HuggingFace downloads at runtime.

```bash
docker build -t recall:latest .
docker run -p 8000:8000 \
  -e REDIS_URL=redis://redis:6379 \
  -e QDRANT_URL=http://qdrant:6333 \
  recall:latest
```

### Health Checks

The `/health` endpoint returns service status:

```json
{ "status": "healthy" }
```

Use this for container orchestration health probes.

## Roadmap

- [ ] Authentication & API keys
- [ ] Batch search endpoint
- [ ] Webhook notifications for ingestion
- [ ] Support for Weaviate backend
- [ ] Multi-tenancy support
- [ ] Metrics & observability (Prometheus)

## Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ❤️ using FastAPI, Qdrant, and sentence-transformers
</p>

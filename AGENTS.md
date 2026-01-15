# AGENTS.md - Recall Project Guide

## Project Overview
Recall is a generic multimodal semantic search engine (schema-agnostic). It allows dynamic schema definitions, pluggable embedding models (Text/Image), and hybrid search over arbitrary collections.

## Tech Stack
- **Language**: Python 3.11+
- **Package Manager**: uv (recommended) or pip
- **API**: FastAPI
- **Validation**: Pydantic v2
- **Vector DB**: Qdrant (async client)
- **Task Queue**: Arq (Redis-based)
- **Metadata Store**: Redis
- **ML**: sentence-transformers (CLIP, MiniLM)
- **Testing**: pytest, pytest-asyncio, pytest-cov, fakeredis

## Project Structure
```
recall/
├── src/recall/
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Settings via pydantic-settings
│   ├── models/              # Pydantic schemas (collection, document, search, errors, task)
│   ├── core/
│   │   ├── embedders/       # BaseEmbedder ABC + TextEmbedder, CLIPEmbedder, Factory
│   │   ├── vectordb/        # VectorDBClient ABC + QdrantAdapter, Factory
│   │   ├── transpiler/      # DSL → Qdrant filter transpiler
│   │   └── utils.py         # Deterministic UUID generation for idempotent upserts
│   ├── services/            # Business logic (registry, ingestion, search, schema_validator)
│   ├── api/v1/              # FastAPI routers (collections, documents, search, tasks)
│   └── workers/             # Arq background tasks
├── scripts/
│   └── preload_models.py    # Pre-download models for Docker image baking
├── tests/
│   ├── conftest.py          # Shared fixtures
│   ├── unit/                # Unit tests (models, services, transpiler, embedders)
│   │   ├── services/        # Service unit tests (registry, search, ingestion)
│   │   └── ...
│   ├── integration/         # API integration tests (mocked external services)
│   └── performance/         # Performance benchmarks
├── docker-compose.yml       # Local dev environment
└── pyproject.toml           # Dependencies and tool config (uv compatible)
```

## Key Design Patterns
- **Strategy Pattern**: `BaseEmbedder` ABC with interchangeable implementations
- **Factory Pattern**: `EmbedderFactory` and `VectorDBFactory` for instance creation
- **Dependency Injection**: FastAPI `Depends()` for services
- **Schema-on-Write**: Collection schemas defined at creation time
- **Dynamic Schema Validation**: Pydantic `create_model()` for runtime payload validation
- **Idempotent Upserts**: Deterministic UUID5 generation for consistent vector IDs

## Commands

### Development
```bash
# Install dependencies (using uv - recommended)
uv sync --all-extras

# Or using pip
pip install -e ".[dev]"

# Run API server
PYTHONPATH=src uvicorn recall.main:app --reload

# Run background worker
PYTHONPATH=src arq recall.workers.tasks.WorkerSettings

# Start Docker services (Redis + Qdrant)
docker compose up -d redis qdrant
# Compose includes healthchecks + restart policies (qdrant pinned to 1.12.4)
```

### Testing & Linting
```bash
# Run unit tests
uv run pytest tests/unit/ -v

# Run integration tests (uses mocked services)
uv run pytest tests/integration/ -v

# Run all tests with coverage
uv run pytest tests/unit/ tests/integration/ -v --cov=recall --cov-report=term-missing

# Run tests in parallel
uv run pytest tests/ -n auto

# Run tests by marker
uv run pytest -m "unit"           # Unit tests only
uv run pytest -m "integration"    # Integration tests only
uv run pytest -m "not slow"       # Exclude slow tests

# Run linter
uv run ruff check src/ tests/

# Auto-fix lint issues
uv run ruff check src/ tests/ --fix
```

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/collections` | Create collection |
| GET | `/v1/collections` | List collections |
| GET | `/v1/collections/{name}` | Get collection config |
| DELETE | `/v1/collections/{name}` | Delete collection |
| POST | `/v1/collections/{name}/documents` | Ingest documents (validates payload, async) |
| POST | `/v1/collections/{name}/search` | Semantic search |
| GET | `/v1/tasks/{task_id}` | Poll async task status |
| GET | `/v1/collections/models/supported` | List supported models |
| GET | `/health` | Health check |

## Supported Embedding Models
- **Text**: `all-MiniLM-L6-v2` (384d), `all-mpnet-base-v2` (768d)
- **Image**: `clip-ViT-B-32` (512d), `clip-ViT-B-16` (512d), `clip-ViT-L-14` (768d)

## Filter DSL
The search API accepts a filter DSL that transpiles to Qdrant filters:
```json
{
  "op": "AND",
  "conditions": [
    {"op": "EQ", "field": "category", "value": "shoes"},
    {"op": "LT", "field": "price", "value": 200}
  ]
}
```
Supported operators: `EQ`, `NEQ`, `LT`, `LTE`, `GT`, `GTE`, `IN`, `AND`, `OR`

## Error Handling
Typed exceptions in `recall.models.errors`:
- `CollectionNotFoundError`
- `SchemaValidationError`
- `UnsupportedModelError`
- `EmbeddingError`
- `VectorDBError`

## Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| `QDRANT_URL` | `http://localhost:6333` | Qdrant connection URL |
| `DEFAULT_TEXT_MODEL` | `all-MiniLM-L6-v2` | Default text embedding model |
| `DEFAULT_IMAGE_MODEL` | `clip-ViT-B-32` | Default image embedding model |
| `DEBUG` | `false` | Enable debug mode |

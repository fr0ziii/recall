# AGENTS.md - Recall Project Guide

## Project Overview
Recall is a generic multimodal semantic search engine (schema-agnostic). It allows dynamic schema definitions, pluggable embedding models (Text/Image), and hybrid search over arbitrary collections.

## Tech Stack
- **Language**: Python 3.11+
- **API**: FastAPI
- **Validation**: Pydantic v2
- **Vector DB**: Qdrant (async client)
- **Task Queue**: Arq (Redis-based)
- **Metadata Store**: Redis
- **ML**: sentence-transformers (CLIP, MiniLM)

## Project Structure
```
recall/
├── src/recall/
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Settings via pydantic-settings
│   ├── models/              # Pydantic schemas (collection, document, search, errors)
│   ├── core/
│   │   ├── embedders/       # BaseEmbedder ABC + TextEmbedder, CLIPEmbedder, Factory
│   │   ├── vectordb/        # VectorDBClient ABC + QdrantAdapter, Factory
│   │   └── transpiler/      # DSL → Qdrant filter transpiler
│   ├── services/            # Business logic (registry, ingestion, search)
│   ├── api/v1/              # FastAPI routers (collections, documents, search)
│   └── workers/             # Arq background tasks
├── tests/
│   ├── unit/                # Unit tests (transpiler, embedders)
│   └── integration/         # E2E tests (requires Docker services)
├── docker-compose.yml       # Local dev environment
└── pyproject.toml           # Dependencies and tool config
```

## Key Design Patterns
- **Strategy Pattern**: `BaseEmbedder` ABC with interchangeable implementations
- **Factory Pattern**: `EmbedderFactory` and `VectorDBFactory` for instance creation
- **Dependency Injection**: FastAPI `Depends()` for services
- **Schema-on-Write**: Collection schemas defined at creation time

## Commands

### Development
```bash
# Install dependencies
pip install -e ".[dev]"

# Run API server
PYTHONPATH=src uvicorn recall.main:app --reload

# Run background worker
PYTHONPATH=src arq recall.workers.tasks.WorkerSettings

# Start Docker services (Redis + Qdrant)
docker-compose up -d redis qdrant
```

### Testing & Linting
```bash
# Run unit tests
PYTHONPATH=src pytest tests/unit/ -v

# Run linter
PYTHONPATH=src ruff check src/

# Auto-fix lint issues
PYTHONPATH=src ruff check src/ --fix
```

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/collections` | Create collection |
| GET | `/v1/collections` | List collections |
| GET | `/v1/collections/{name}` | Get collection config |
| DELETE | `/v1/collections/{name}` | Delete collection |
| POST | `/v1/collections/{name}/documents` | Ingest documents (async) |
| POST | `/v1/collections/{name}/search` | Semantic search |
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

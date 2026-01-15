"""Pydantic models for Recall."""

from recall.models.collection import (
    Collection,
    CreateCollectionRequest,
    EmbeddingConfig,
    IndexSchema,
    Modality,
)
from recall.models.document import Document, IngestRequest, IngestResponse
from recall.models.errors import (
    CollectionNotFoundError,
    EmbeddingError,
    RecallError,
    SchemaValidationError,
    UnsupportedModelError,
    VectorDBError,
)
from recall.models.search import SearchRequest, SearchResponse, SearchResult

__all__ = [
    "Collection",
    "CollectionNotFoundError",
    "CreateCollectionRequest",
    "Document",
    "EmbeddingConfig",
    "EmbeddingError",
    "IndexSchema",
    "IngestRequest",
    "IngestResponse",
    "Modality",
    "RecallError",
    "SchemaValidationError",
    "SearchRequest",
    "SearchResponse",
    "SearchResult",
    "UnsupportedModelError",
    "VectorDBError",
]

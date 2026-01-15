"""Shared test fixtures and configuration."""

from unittest.mock import AsyncMock, MagicMock

import pytest

from recall.models.collection import Collection, EmbeddingConfig, FieldType, Modality


@pytest.fixture
def sample_collection() -> Collection:
    """Create a sample collection for testing."""
    return Collection(
        name="test-collection",
        embedding_config=EmbeddingConfig(
            model="all-MiniLM-L6-v2",
            modality=Modality.TEXT,
        ),
        index_schema={
            "category": FieldType.KEYWORD,
            "price": FieldType.FLOAT,
            "rating": FieldType.INT,
        },
        created_at="2024-01-01T00:00:00Z",
    )


@pytest.fixture
def sample_image_collection() -> Collection:
    """Create a sample image collection for testing."""
    return Collection(
        name="image-collection",
        embedding_config=EmbeddingConfig(
            model="clip-ViT-B-32",
            modality=Modality.IMAGE,
        ),
        index_schema={
            "label": FieldType.KEYWORD,
            "confidence": FieldType.FLOAT,
        },
        created_at="2024-01-01T00:00:00Z",
    )


@pytest.fixture
def mock_vector() -> list[float]:
    """Create a sample embedding vector (384 dimensions for MiniLM)."""
    return [0.1] * 384


@pytest.fixture
def mock_clip_vector() -> list[float]:
    """Create a sample CLIP embedding vector (512 dimensions)."""
    return [0.1] * 512


@pytest.fixture
def mock_embedder():
    """Create a mock embedder."""
    embedder = MagicMock()
    embedder.embed.return_value = [0.1] * 384
    embedder.embed_batch.return_value = [[0.1] * 384, [0.1] * 384]
    embedder.dimensions = 384
    embedder.model_name = "all-MiniLM-L6-v2"
    return embedder


@pytest.fixture
def mock_vectordb():
    """Create a mock vector database client."""
    client = AsyncMock()
    client.create_collection = AsyncMock(return_value=None)
    client.delete_collection = AsyncMock(return_value=True)
    client.collection_exists = AsyncMock(return_value=True)
    client.upsert = AsyncMock(return_value=1)
    client.search = AsyncMock(return_value=[])
    client.close = AsyncMock(return_value=None)
    return client

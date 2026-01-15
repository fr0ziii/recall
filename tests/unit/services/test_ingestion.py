"""Tests for IngestionService."""

from unittest.mock import AsyncMock, MagicMock

import pytest

from recall.models.collection import Collection, EmbeddingConfig, Modality
from recall.models.document import Document, IngestRequest
from recall.models.errors import CollectionNotFoundError
from recall.services.ingestion import IngestionService
from recall.services.registry import SchemaRegistry


def _make_mock_collection(name: str = "test-collection") -> Collection:
    """Create a mock collection for testing."""
    return Collection(
        name=name,
        embedding_config=EmbeddingConfig(model="all-MiniLM-L6-v2", modality=Modality.TEXT),
        index_schema={},
    )


@pytest.mark.unit
class TestIngestionService:
    """Test cases for IngestionService."""

    @pytest.fixture
    def mock_registry(self):
        """Create a mock registry."""
        registry = AsyncMock(spec=SchemaRegistry)
        registry.get = AsyncMock(return_value=_make_mock_collection())
        return registry

    @pytest.fixture
    def mock_arq_redis(self):
        """Create a mock Arq Redis client."""
        arq = AsyncMock()
        arq.enqueue_job = AsyncMock(return_value=MagicMock(job_id="test-job"))
        return arq

    @pytest.fixture
    def ingestion_service(self, mock_registry, mock_arq_redis):
        """Create IngestionService with mocks."""
        return IngestionService(mock_registry, mock_arq_redis)

    async def test_ingest_single_document(self, ingestion_service, mock_arq_redis):
        request = IngestRequest(
            documents=[Document(id="doc-1", content_raw="Test content")]
        )
        response = await ingestion_service.ingest("test-collection", request)

        assert response.status == "queued"
        assert response.documents_queued == 1
        assert response.task_id is not None
        mock_arq_redis.enqueue_job.assert_called_once()

    async def test_ingest_multiple_documents(self, ingestion_service, mock_arq_redis):
        docs = [
            Document(id="doc-1", content_raw="Content 1"),
            Document(id="doc-2", content_raw="Content 2"),
            Document(id="doc-3", content_raw="Content 3"),
        ]
        request = IngestRequest(documents=docs)
        response = await ingestion_service.ingest("test-collection", request)

        assert response.documents_queued == 3
        assert mock_arq_redis.enqueue_job.call_count == 3

    async def test_ingest_with_uri(self, ingestion_service, mock_arq_redis):
        request = IngestRequest(
            documents=[Document(id="doc-1", content_uri="https://example.com/file.txt")]
        )
        await ingestion_service.ingest("test-collection", request)

        call_kwargs = mock_arq_redis.enqueue_job.call_args.kwargs
        assert call_kwargs["content_uri"] == "https://example.com/file.txt"
        assert call_kwargs["content_raw"] is None

    async def test_ingest_with_payload(self, ingestion_service, mock_arq_redis):
        request = IngestRequest(
            documents=[
                Document(
                    id="doc-1",
                    content_raw="Content",
                    payload={"category": "shoes", "price": 99.99},
                )
            ]
        )
        await ingestion_service.ingest("test-collection", request)

        call_kwargs = mock_arq_redis.enqueue_job.call_args.kwargs
        assert call_kwargs["payload"] == {"category": "shoes", "price": 99.99}

    async def test_ingest_collection_not_found(self, mock_arq_redis):
        registry = AsyncMock(spec=SchemaRegistry)
        registry.get = AsyncMock(side_effect=CollectionNotFoundError("nonexistent"))

        service = IngestionService(registry, mock_arq_redis)
        request = IngestRequest(
            documents=[Document(id="doc-1", content_raw="Test")]
        )

        with pytest.raises(CollectionNotFoundError):
            await service.ingest("nonexistent", request)

    async def test_job_id_format(self, ingestion_service, mock_arq_redis):
        request = IngestRequest(
            documents=[Document(id="doc-123", content_raw="Test")]
        )
        response = await ingestion_service.ingest("test-collection", request)

        call_kwargs = mock_arq_redis.enqueue_job.call_args.kwargs
        assert response.task_id in call_kwargs["_job_id"]
        assert "doc-123" in call_kwargs["_job_id"]


@pytest.mark.unit
class TestFetchContent:
    """Test cases for IngestionService.fetch_content."""

    @pytest.mark.skip(reason="Requires HTTP mocking - covered in integration tests")
    async def test_fetch_content_success(self):
        pass

"""Tests for SearchService."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from recall.core.vectordb.base import SearchResult as VDBSearchResult
from recall.models.errors import CollectionNotFoundError
from recall.models.search import LtCondition, SearchRequest
from recall.services.registry import SchemaRegistry
from recall.services.search import SearchService


@pytest.mark.unit
class TestSearchService:
    """Test cases for SearchService."""

    @pytest.fixture
    def mock_registry(self, sample_collection):
        """Create a mock registry."""
        registry = AsyncMock(spec=SchemaRegistry)
        registry.get = AsyncMock(return_value=sample_collection)
        return registry

    @pytest.fixture
    def mock_vectordb(self):
        """Create a mock vector database."""
        vectordb = AsyncMock()
        vectordb.search = AsyncMock(
            return_value=[
                VDBSearchResult(id="doc-1", score=0.95, payload={"category": "shoes"}),
                VDBSearchResult(id="doc-2", score=0.85, payload={"category": "boots"}),
            ]
        )
        return vectordb

    @pytest.fixture
    def search_service(self, mock_registry, mock_vectordb):
        """Create SearchService with mocks."""
        return SearchService(mock_registry, mock_vectordb)

    async def test_search_basic_query(self, search_service, mock_vectordb):
        with patch("recall.services.search.EmbedderFactory") as mock_factory:
            mock_embedder = MagicMock()
            mock_embedder.embed.return_value = [0.1] * 384
            mock_factory.create.return_value = mock_embedder

            request = SearchRequest(query="running shoes", limit=10)
            response = await search_service.search("test-collection", request)

            assert response.count == 2
            assert response.query == "running shoes"
            assert len(response.results) == 2
            assert response.results[0].id == "doc-1"
            assert response.results[0].score == 0.95

    async def test_search_with_filter(self, search_service, mock_vectordb):
        with patch("recall.services.search.EmbedderFactory") as mock_factory:
            mock_embedder = MagicMock()
            mock_embedder.embed.return_value = [0.1] * 384
            mock_factory.create.return_value = mock_embedder

            request = SearchRequest(
                query="shoes",
                filter=LtCondition(field="price", value=100),
                limit=5,
            )
            await search_service.search("test-collection", request)

            mock_vectordb.search.assert_called_once()
            call_args = mock_vectordb.search.call_args
            assert call_args.kwargs["limit"] == 5
            assert call_args.kwargs["filter"] is not None

    async def test_search_collection_not_found(self, mock_vectordb):
        registry = AsyncMock(spec=SchemaRegistry)
        registry.get = AsyncMock(side_effect=CollectionNotFoundError("missing"))

        service = SearchService(registry, mock_vectordb)
        request = SearchRequest(query="test")

        with pytest.raises(CollectionNotFoundError):
            await service.search("missing", request)

    async def test_search_uses_correct_embedder(self, mock_registry, mock_vectordb):
        with patch("recall.services.search.EmbedderFactory") as mock_factory:
            mock_embedder = MagicMock()
            mock_embedder.embed.return_value = [0.1] * 384
            mock_factory.create.return_value = mock_embedder

            service = SearchService(mock_registry, mock_vectordb)
            request = SearchRequest(query="test query")
            await service.search("test-collection", request)

            mock_factory.create.assert_called_once_with("all-MiniLM-L6-v2")
            mock_embedder.embed.assert_called_once_with("test query")

    async def test_search_with_payload_and_vectors(self, search_service, mock_vectordb):
        with patch("recall.services.search.EmbedderFactory") as mock_factory:
            mock_embedder = MagicMock()
            mock_embedder.embed.return_value = [0.1] * 384
            mock_factory.create.return_value = mock_embedder

            request = SearchRequest(
                query="test",
                with_payload=False,
                with_vectors=True,
            )
            await search_service.search("test-collection", request)

            call_args = mock_vectordb.search.call_args
            assert call_args.kwargs["with_payload"] is False
            assert call_args.kwargs["with_vectors"] is True

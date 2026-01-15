"""Integration tests for Search API."""

from unittest.mock import MagicMock, patch

import pytest
from httpx import AsyncClient

from recall.core.vectordb.base import SearchResult as VDBSearchResult


@pytest.mark.integration
class TestSearchAPI:
    """Test cases for /v1/collections/{name}/search endpoints."""

    @pytest.fixture(autouse=True)
    async def setup_collection(self, client: AsyncClient, mock_app):
        """Create a test collection before each test."""
        await client.post(
            "/v1/collections",
            json={
                "name": "search-test",
                "embedding_config": {
                    "model": "all-MiniLM-L6-v2",
                    "modality": "text",
                },
                "index_schema": {
                    "category": "keyword",
                    "price": "float",
                },
            },
        )

        mock_app.state.vectordb.search.return_value = [
            VDBSearchResult(id="doc-1", score=0.95, payload={"category": "shoes"}),
            VDBSearchResult(id="doc-2", score=0.85, payload={"category": "boots"}),
        ]

        yield
        await client.delete("/v1/collections/search-test")

    async def test_search_basic(self, client: AsyncClient):
        with patch("recall.services.search.EmbedderFactory") as mock_factory:
            mock_embedder = MagicMock()
            mock_embedder.embed.return_value = [0.1] * 384
            mock_factory.create.return_value = mock_embedder

            response = await client.post(
                "/v1/collections/search-test/search",
                json={"query": "running shoes"},
            )

        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert data["query"] == "running shoes"
        assert data["count"] == 2

    async def test_search_with_filter(self, client: AsyncClient):
        with patch("recall.services.search.EmbedderFactory") as mock_factory:
            mock_embedder = MagicMock()
            mock_embedder.embed.return_value = [0.1] * 384
            mock_factory.create.return_value = mock_embedder

            response = await client.post(
                "/v1/collections/search-test/search",
                json={
                    "query": "shoes",
                    "filter": {
                        "op": "LT",
                        "field": "price",
                        "value": 100,
                    },
                    "limit": 5,
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert "results" in data

    async def test_search_with_complex_filter(self, client: AsyncClient):
        with patch("recall.services.search.EmbedderFactory") as mock_factory:
            mock_embedder = MagicMock()
            mock_embedder.embed.return_value = [0.1] * 384
            mock_factory.create.return_value = mock_embedder

            response = await client.post(
                "/v1/collections/search-test/search",
                json={
                    "query": "shoes",
                    "filter": {
                        "op": "AND",
                        "conditions": [
                            {"op": "EQ", "field": "category", "value": "footwear"},
                            {"op": "LT", "field": "price", "value": 200},
                        ],
                    },
                },
            )

        assert response.status_code == 200

    async def test_search_collection_not_found(self, client: AsyncClient):
        response = await client.post(
            "/v1/collections/nonexistent/search",
            json={"query": "test"},
        )
        assert response.status_code == 404

    async def test_search_invalid_limit(self, client: AsyncClient):
        response = await client.post(
            "/v1/collections/search-test/search",
            json={"query": "test", "limit": 0},
        )
        assert response.status_code == 422

    async def test_search_limit_too_high(self, client: AsyncClient):
        response = await client.post(
            "/v1/collections/search-test/search",
            json={"query": "test", "limit": 101},
        )
        assert response.status_code == 422


@pytest.mark.integration
class TestHealthEndpoint:
    """Test cases for health check endpoint."""

    async def test_health_check(self, client: AsyncClient):
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

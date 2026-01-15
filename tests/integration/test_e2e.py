"""End-to-end integration tests.

These tests require running Redis and Qdrant services for full E2E.
Run with: docker-compose up -d redis qdrant && pytest tests/integration/ -m integration

For tests without Docker dependencies, use the mocked fixtures from conftest.py.
"""

from unittest.mock import MagicMock, patch

import pytest
from httpx import AsyncClient

from recall.core.vectordb.base import SearchResult as VDBSearchResult


@pytest.mark.integration
class TestE2EFlow:
    """End-to-end test for complete flow with mocked external services."""

    async def test_health_check(self, client: AsyncClient):
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

    async def test_list_supported_models(self, client: AsyncClient):
        response = await client.get("/v1/collections/models/supported")
        assert response.status_code == 200
        models = response.json()
        assert "all-MiniLM-L6-v2" in models
        assert "clip-ViT-B-32" in models

    async def test_create_collection(self, client: AsyncClient):
        response = await client.post(
            "/v1/collections",
            json={
                "name": "e2e-test-collection",
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
        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "created"
        assert data["name"] == "e2e-test-collection"

    async def test_get_collection(self, client: AsyncClient):
        await client.post(
            "/v1/collections",
            json={
                "name": "e2e-get-test",
                "embedding_config": {
                    "model": "all-MiniLM-L6-v2",
                    "modality": "text",
                },
            },
        )

        response = await client.get("/v1/collections/e2e-get-test")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "e2e-get-test"

    async def test_ingest_documents(self, client: AsyncClient):
        await client.post(
            "/v1/collections",
            json={
                "name": "e2e-ingest-test",
                "embedding_config": {
                    "model": "all-MiniLM-L6-v2",
                    "modality": "text",
                },
            },
        )

        response = await client.post(
            "/v1/collections/e2e-ingest-test/documents",
            json={
                "documents": [
                    {
                        "id": "doc-1",
                        "content_raw": "Red running shoes for athletes",
                        "payload": {"category": "shoes", "price": 99.99},
                    },
                    {
                        "id": "doc-2",
                        "content_raw": "Blue hiking boots for outdoor adventures",
                        "payload": {"category": "boots", "price": 149.99},
                    },
                ]
            },
        )
        assert response.status_code == 202
        data = response.json()
        assert data["status"] == "queued"
        assert data["documents_queued"] == 2

    async def test_search(self, client: AsyncClient, mock_app):
        await client.post(
            "/v1/collections",
            json={
                "name": "e2e-search-test",
                "embedding_config": {
                    "model": "all-MiniLM-L6-v2",
                    "modality": "text",
                },
            },
        )

        mock_app.state.vectordb.search.return_value = [
            VDBSearchResult(id="doc-1", score=0.95, payload={"category": "shoes"}),
        ]

        with patch("recall.services.search.EmbedderFactory") as mock_factory:
            mock_embedder = MagicMock()
            mock_embedder.embed.return_value = [0.1] * 384
            mock_factory.create.return_value = mock_embedder

            response = await client.post(
                "/v1/collections/e2e-search-test/search",
                json={
                    "query": "running shoes",
                    "filter": {
                        "op": "LT",
                        "field": "price",
                        "value": 150,
                    },
                    "limit": 5,
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert "count" in data

    async def test_delete_collection(self, client: AsyncClient):
        await client.post(
            "/v1/collections",
            json={
                "name": "e2e-delete-test",
                "embedding_config": {
                    "model": "all-MiniLM-L6-v2",
                    "modality": "text",
                },
            },
        )

        response = await client.delete("/v1/collections/e2e-delete-test")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "deleted"

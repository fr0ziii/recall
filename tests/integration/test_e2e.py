"""End-to-end integration tests.

These tests require running Redis and Qdrant services.
Run with: docker-compose up -d redis qdrant && pytest tests/integration/
"""

import pytest
from httpx import ASGITransport, AsyncClient

from recall.main import app


@pytest.fixture
async def client():
    """Create test client."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac


@pytest.mark.skip(reason="Requires running Redis and Qdrant")
class TestE2EFlow:
    """End-to-end test for complete flow."""

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
                "name": "test-collection",
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
        assert data["name"] == "test-collection"

    async def test_get_collection(self, client: AsyncClient):
        response = await client.get("/v1/collections/test-collection")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "test-collection"

    async def test_ingest_documents(self, client: AsyncClient):
        response = await client.post(
            "/v1/collections/test-collection/documents",
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

    async def test_search(self, client: AsyncClient):
        response = await client.post(
            "/v1/collections/test-collection/search",
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
        response = await client.delete("/v1/collections/test-collection")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "deleted"

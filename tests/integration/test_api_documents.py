"""Integration tests for Documents API."""

import pytest
from httpx import AsyncClient


@pytest.mark.integration
class TestDocumentsAPI:
    """Test cases for /v1/collections/{name}/documents endpoints."""

    @pytest.fixture(autouse=True)
    async def setup_collection(self, client: AsyncClient):
        """Create a test collection before each test."""
        await client.post(
            "/v1/collections",
            json={
                "name": "docs-test",
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
        yield
        await client.delete("/v1/collections/docs-test")

    async def test_ingest_single_document(self, client: AsyncClient):
        response = await client.post(
            "/v1/collections/docs-test/documents",
            json={
                "documents": [
                    {
                        "id": "doc-1",
                        "content_raw": "Test document content",
                        "payload": {"category": "test", "price": 19.99},
                    }
                ]
            },
        )
        assert response.status_code == 202
        data = response.json()
        assert data["status"] == "queued"
        assert data["documents_queued"] == 1
        assert "task_id" in data

    async def test_ingest_multiple_documents(self, client: AsyncClient):
        response = await client.post(
            "/v1/collections/docs-test/documents",
            json={
                "documents": [
                    {
                        "id": "doc-1",
                        "content_raw": "First document",
                        "payload": {"category": "a", "price": 1.0},
                    },
                    {
                        "id": "doc-2",
                        "content_raw": "Second document",
                        "payload": {"category": "b", "price": 2.0},
                    },
                    {
                        "id": "doc-3",
                        "content_raw": "Third document",
                        "payload": {"category": "c", "price": 3.0},
                    },
                ]
            },
        )
        assert response.status_code == 202
        assert response.json()["documents_queued"] == 3

    async def test_ingest_with_uri(self, client: AsyncClient):
        response = await client.post(
            "/v1/collections/docs-test/documents",
            json={
                "documents": [
                    {
                        "id": "doc-uri",
                        "content_uri": "https://example.com/document.txt",
                        "payload": {"category": "uri-test", "price": 0.0},
                    }
                ]
            },
        )
        assert response.status_code == 202

    async def test_ingest_collection_not_found(self, client: AsyncClient):
        response = await client.post(
            "/v1/collections/nonexistent/documents",
            json={
                "documents": [
                    {"id": "doc-1", "content_raw": "Test", "payload": {}}
                ]
            },
        )
        assert response.status_code == 404

    async def test_ingest_empty_documents_rejected(self, client: AsyncClient):
        response = await client.post(
            "/v1/collections/docs-test/documents",
            json={"documents": []},
        )
        assert response.status_code == 422

    async def test_ingest_too_many_documents_rejected(self, client: AsyncClient):
        docs = [
            {"id": f"doc-{i}", "content_raw": "x", "payload": {"category": "x", "price": 1.0}}
            for i in range(101)
        ]
        response = await client.post(
            "/v1/collections/docs-test/documents",
            json={"documents": docs},
        )
        assert response.status_code == 422

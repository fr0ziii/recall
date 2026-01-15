"""Integration tests for Collections API."""

import pytest
from httpx import AsyncClient


@pytest.mark.integration
class TestCollectionsAPI:
    """Test cases for /v1/collections endpoints."""

    async def test_create_collection_success(self, client: AsyncClient):
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

    async def test_create_collection_invalid_name(self, client: AsyncClient):
        response = await client.post(
            "/v1/collections",
            json={
                "name": "Invalid Name With Spaces",
                "embedding_config": {
                    "model": "all-MiniLM-L6-v2",
                    "modality": "text",
                },
            },
        )
        assert response.status_code == 422

    async def test_create_collection_unsupported_model(self, client: AsyncClient):
        response = await client.post(
            "/v1/collections",
            json={
                "name": "test-collection",
                "embedding_config": {
                    "model": "unknown-model",
                    "modality": "text",
                },
            },
        )
        assert response.status_code == 400
        assert "not supported" in response.json()["detail"]

    async def test_create_collection_conflict(self, client: AsyncClient):
        await client.post(
            "/v1/collections",
            json={
                "name": "duplicate-collection",
                "embedding_config": {
                    "model": "all-MiniLM-L6-v2",
                    "modality": "text",
                },
            },
        )

        response = await client.post(
            "/v1/collections",
            json={
                "name": "duplicate-collection",
                "embedding_config": {
                    "model": "all-MiniLM-L6-v2",
                    "modality": "text",
                },
            },
        )
        assert response.status_code == 409

    async def test_list_collections_empty(self, client: AsyncClient):
        response = await client.get("/v1/collections")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    async def test_list_collections_with_items(self, client: AsyncClient):
        for name in ["collection-a", "collection-b"]:
            await client.post(
                "/v1/collections",
                json={
                    "name": name,
                    "embedding_config": {
                        "model": "all-MiniLM-L6-v2",
                        "modality": "text",
                    },
                },
            )

        response = await client.get("/v1/collections")
        assert response.status_code == 200
        collections = response.json()
        assert "collection-a" in collections
        assert "collection-b" in collections

    async def test_get_collection_success(self, client: AsyncClient):
        await client.post(
            "/v1/collections",
            json={
                "name": "get-test",
                "embedding_config": {
                    "model": "all-MiniLM-L6-v2",
                    "modality": "text",
                },
                "index_schema": {"category": "keyword"},
            },
        )

        response = await client.get("/v1/collections/get-test")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "get-test"
        assert data["embedding_config"]["model"] == "all-MiniLM-L6-v2"

    async def test_get_collection_not_found(self, client: AsyncClient):
        response = await client.get("/v1/collections/nonexistent")
        assert response.status_code == 404

    async def test_delete_collection_success(self, client: AsyncClient):
        await client.post(
            "/v1/collections",
            json={
                "name": "delete-test",
                "embedding_config": {
                    "model": "all-MiniLM-L6-v2",
                    "modality": "text",
                },
            },
        )

        response = await client.delete("/v1/collections/delete-test")
        assert response.status_code == 200
        assert response.json()["status"] == "deleted"

    async def test_delete_collection_not_found(self, client: AsyncClient):
        response = await client.delete("/v1/collections/nonexistent")
        assert response.status_code == 404

    async def test_list_supported_models(self, client: AsyncClient):
        response = await client.get("/v1/collections/models/supported")
        assert response.status_code == 200
        models = response.json()
        assert "all-MiniLM-L6-v2" in models
        assert "clip-ViT-B-32" in models

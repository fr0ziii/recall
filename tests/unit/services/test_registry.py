"""Tests for SchemaRegistry service."""


import pytest

from recall.models.collection import CreateCollectionRequest, EmbeddingConfig, FieldType, Modality
from recall.models.errors import CollectionNotFoundError
from recall.services.registry import SchemaRegistry


@pytest.mark.unit
class TestSchemaRegistry:
    """Test cases for SchemaRegistry service."""

    @pytest.fixture
    def registry(self, fake_redis) -> SchemaRegistry:
        """Create a SchemaRegistry with fake Redis."""
        return SchemaRegistry(fake_redis)

    @pytest.fixture
    def create_request(self) -> CreateCollectionRequest:
        """Create a sample collection request."""
        return CreateCollectionRequest(
            name="test-collection",
            embedding_config=EmbeddingConfig(
                model="all-MiniLM-L6-v2",
                modality=Modality.TEXT,
            ),
            index_schema={"category": FieldType.KEYWORD, "price": FieldType.FLOAT},
        )

    async def test_save_collection(self, registry, create_request):
        collection = await registry.save(create_request)
        assert collection.name == "test-collection"
        assert collection.embedding_config.model == "all-MiniLM-L6-v2"
        assert collection.created_at is not None

    async def test_get_collection(self, registry, create_request):
        await registry.save(create_request)
        collection = await registry.get("test-collection")
        assert collection.name == "test-collection"
        assert collection.index_schema["category"] == FieldType.KEYWORD

    async def test_get_nonexistent_collection_raises(self, registry):
        with pytest.raises(CollectionNotFoundError) as exc_info:
            await registry.get("nonexistent")
        assert "nonexistent" in str(exc_info.value)

    async def test_exists_returns_true_for_existing(self, registry, create_request):
        await registry.save(create_request)
        assert await registry.exists("test-collection") is True

    async def test_exists_returns_false_for_nonexistent(self, registry):
        assert await registry.exists("nonexistent") is False

    async def test_delete_existing_collection(self, registry, create_request):
        await registry.save(create_request)
        result = await registry.delete("test-collection")
        assert result is True
        assert await registry.exists("test-collection") is False

    async def test_delete_nonexistent_collection(self, registry):
        result = await registry.delete("nonexistent")
        assert result is False

    async def test_list_all_empty(self, registry):
        collections = await registry.list_all()
        assert collections == []

    async def test_list_all_multiple_collections(self, registry):
        for name in ["collection-a", "collection-b", "collection-c"]:
            request = CreateCollectionRequest(
                name=name,
                embedding_config=EmbeddingConfig(
                    model="all-MiniLM-L6-v2",
                    modality=Modality.TEXT,
                ),
            )
            await registry.save(request)

        collections = await registry.list_all()
        assert len(collections) == 3
        assert set(collections) == {"collection-a", "collection-b", "collection-c"}

    async def test_key_prefix(self, registry):
        assert registry.KEY_PREFIX == "recall:collection:"
        assert registry._key("test") == "recall:collection:test"

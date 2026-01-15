"""Schema registry for collection configurations."""

from datetime import UTC, datetime

from redis.asyncio import Redis

from recall.models.collection import Collection, CreateCollectionRequest
from recall.models.errors import CollectionNotFoundError


class SchemaRegistry:
    """Redis-backed schema registry for collection configurations."""

    KEY_PREFIX = "recall:collection:"

    def __init__(self, redis: Redis):
        self._redis = redis

    def _key(self, name: str) -> str:
        return f"{self.KEY_PREFIX}{name}"

    async def save(self, request: CreateCollectionRequest) -> Collection:
        """Save a collection configuration.

        Args:
            request: Collection creation request

        Returns:
            Created collection with metadata
        """
        collection = Collection(
            name=request.name,
            embedding_config=request.embedding_config,
            index_schema=request.index_schema,
            created_at=datetime.now(UTC).isoformat(),
        )

        await self._redis.set(
            self._key(collection.name),
            collection.model_dump_json(),
        )

        return collection

    async def get(self, name: str) -> Collection:
        """Get a collection configuration.

        Args:
            name: Collection name

        Returns:
            Collection configuration

        Raises:
            CollectionNotFoundError: If collection doesn't exist
        """
        data = await self._redis.get(self._key(name))
        if data is None:
            raise CollectionNotFoundError(name)

        return Collection.model_validate_json(data)

    async def exists(self, name: str) -> bool:
        """Check if a collection exists.

        Args:
            name: Collection name

        Returns:
            True if exists
        """
        return await self._redis.exists(self._key(name)) > 0

    async def delete(self, name: str) -> bool:
        """Delete a collection configuration.

        Args:
            name: Collection name

        Returns:
            True if deleted, False if not found
        """
        result = await self._redis.delete(self._key(name))
        return result > 0

    async def list_all(self) -> list[str]:
        """List all collection names.

        Returns:
            List of collection names
        """
        keys = await self._redis.keys(f"{self.KEY_PREFIX}*")
        prefix_len = len(self.KEY_PREFIX)
        return [k.decode()[prefix_len:] if isinstance(k, bytes) else k[prefix_len:] for k in keys]

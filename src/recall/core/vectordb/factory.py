"""Factory for creating vector database clients."""

from recall.core.vectordb.base import VectorDBClient
from recall.core.vectordb.qdrant import QdrantAdapter


class VectorDBFactory:
    """Factory for creating vector database client instances."""

    _instance: VectorDBClient | None = None

    @classmethod
    def create(cls, backend: str = "qdrant", url: str | None = None) -> VectorDBClient:
        """Create a vector database client.

        Args:
            backend: Database backend type (currently only 'qdrant')
            url: Connection URL

        Returns:
            Configured VectorDBClient instance
        """
        if backend == "qdrant":
            return QdrantAdapter(url=url or "http://localhost:6333")
        raise ValueError(f"Unsupported backend: {backend}")

    @classmethod
    def get_singleton(cls, backend: str = "qdrant", url: str | None = None) -> VectorDBClient:
        """Get or create a singleton instance."""
        if cls._instance is None:
            cls._instance = cls.create(backend, url)
        return cls._instance

    @classmethod
    async def close_singleton(cls) -> None:
        """Close the singleton instance."""
        if cls._instance:
            await cls._instance.close()
            cls._instance = None

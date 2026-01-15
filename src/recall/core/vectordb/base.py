"""Base vector database client abstract class."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any


@dataclass
class Point:
    """Represents a vector point with payload."""

    id: str
    vector: list[float]
    payload: dict[str, Any] | None = None


@dataclass
class SearchResult:
    """Represents a search result."""

    id: str
    score: float
    payload: dict[str, Any] | None = None
    vector: list[float] | None = None


class VectorDBClient(ABC):
    """Abstract base class for vector database clients."""

    @abstractmethod
    async def create_collection(
        self,
        name: str,
        vector_size: int,
        schema: dict[str, str] | None = None,
    ) -> None:
        """Create a new collection.

        Args:
            name: Collection name
            vector_size: Dimensionality of vectors
            schema: Optional index schema for payload fields
        """
        ...

    @abstractmethod
    async def delete_collection(self, name: str) -> bool:
        """Delete a collection.

        Args:
            name: Collection name

        Returns:
            True if deleted, False if not found
        """
        ...

    @abstractmethod
    async def collection_exists(self, name: str) -> bool:
        """Check if a collection exists.

        Args:
            name: Collection name

        Returns:
            True if exists
        """
        ...

    @abstractmethod
    async def upsert(self, collection: str, points: list[Point]) -> int:
        """Insert or update points.

        Args:
            collection: Collection name
            points: List of points to upsert

        Returns:
            Number of points upserted
        """
        ...

    @abstractmethod
    async def search(
        self,
        collection: str,
        vector: list[float],
        filter: Any | None = None,
        limit: int = 10,
        with_payload: bool = True,
        with_vectors: bool = False,
    ) -> list[SearchResult]:
        """Search for similar vectors.

        Args:
            collection: Collection name
            vector: Query vector
            filter: Optional filter conditions
            limit: Maximum results to return
            with_payload: Include payload in results
            with_vectors: Include vectors in results

        Returns:
            List of search results
        """
        ...

    @abstractmethod
    async def close(self) -> None:
        """Close the client connection."""
        ...

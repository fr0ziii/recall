"""Base embedder abstract class (Strategy Pattern)."""

from abc import ABC, abstractmethod


class BaseEmbedder(ABC):
    """Abstract base class for all embedding models."""

    @abstractmethod
    def embed(self, content: bytes | str) -> list[float]:
        """Generate embedding vector for the given content.

        Args:
            content: Raw bytes (for images) or string (for text)

        Returns:
            Embedding vector as list of floats
        """
        ...

    @abstractmethod
    def embed_batch(self, contents: list[bytes | str]) -> list[list[float]]:
        """Generate embedding vectors for multiple contents.

        Args:
            contents: List of raw bytes or strings

        Returns:
            List of embedding vectors
        """
        ...

    @property
    @abstractmethod
    def dimensions(self) -> int:
        """Return the dimensionality of the embedding vectors."""
        ...

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Return the name of the underlying model."""
        ...

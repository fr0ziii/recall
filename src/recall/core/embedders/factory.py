"""Factory for creating embedder instances."""

from functools import lru_cache
from typing import ClassVar

from recall.core.embedders.base import BaseEmbedder
from recall.core.embedders.clip import CLIPEmbedder
from recall.core.embedders.text import TextEmbedder
from recall.models.collection import Modality
from recall.models.errors import UnsupportedModelError


class EmbedderFactory:
    """Factory for creating and caching embedder instances."""

    TEXT_MODELS: ClassVar[set[str]] = {
        "all-MiniLM-L6-v2",
        "all-mpnet-base-v2",
        "paraphrase-MiniLM-L6-v2",
        "multi-qa-MiniLM-L6-cos-v1",
    }

    IMAGE_MODELS: ClassVar[set[str]] = {
        "clip-ViT-B-32",
        "clip-ViT-B-16",
        "clip-ViT-L-14",
    }

    @classmethod
    def supported_models(cls) -> list[str]:
        return sorted(cls.TEXT_MODELS | cls.IMAGE_MODELS)

    @classmethod
    def get_modality(cls, model_name: str) -> Modality:
        if model_name in cls.TEXT_MODELS:
            return Modality.TEXT
        if model_name in cls.IMAGE_MODELS:
            return Modality.IMAGE
        raise UnsupportedModelError(model_name, cls.supported_models())

    @classmethod
    @lru_cache(maxsize=16)
    def create(cls, model_name: str) -> BaseEmbedder:
        """Create or retrieve cached embedder instance.

        Args:
            model_name: Name of the embedding model

        Returns:
            Configured embedder instance

        Raises:
            UnsupportedModelError: If model is not supported
        """
        if model_name in cls.TEXT_MODELS:
            return TextEmbedder(model_name)
        if model_name in cls.IMAGE_MODELS:
            return CLIPEmbedder(model_name)
        raise UnsupportedModelError(model_name, cls.supported_models())

    @classmethod
    def create_for_modality(cls, modality: Modality, model_name: str | None = None) -> BaseEmbedder:
        """Create embedder for a specific modality.

        Args:
            modality: Target modality (text/image)
            model_name: Optional specific model name

        Returns:
            Configured embedder instance
        """
        if model_name:
            return cls.create(model_name)

        if modality == Modality.TEXT:
            return cls.create("all-MiniLM-L6-v2")
        if modality == Modality.IMAGE:
            return cls.create("clip-ViT-B-32")

        raise UnsupportedModelError(f"Unknown modality: {modality}", cls.supported_models())

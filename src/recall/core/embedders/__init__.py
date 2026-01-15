"""Embedder abstractions and implementations."""

from recall.core.embedders.base import BaseEmbedder
from recall.core.embedders.clip import CLIPEmbedder
from recall.core.embedders.factory import EmbedderFactory
from recall.core.embedders.text import TextEmbedder

__all__ = ["BaseEmbedder", "CLIPEmbedder", "EmbedderFactory", "TextEmbedder"]

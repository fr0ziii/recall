"""Text embedder using sentence-transformers."""

from functools import cached_property

from sentence_transformers import SentenceTransformer

from recall.core.embedders.base import BaseEmbedder
from recall.models.errors import EmbeddingError

MODEL_DIMENSIONS = {
    "all-MiniLM-L6-v2": 384,
    "all-mpnet-base-v2": 768,
    "paraphrase-MiniLM-L6-v2": 384,
    "multi-qa-MiniLM-L6-cos-v1": 384,
}


class TextEmbedder(BaseEmbedder):
    """Text embedder using sentence-transformers models."""

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self._model_name = model_name
        self._dimensions = MODEL_DIMENSIONS.get(model_name, 384)

    @cached_property
    def _model(self):
        return SentenceTransformer(self._model_name)

    def embed(self, content: bytes | str) -> list[float]:
        if isinstance(content, bytes):
            content = content.decode("utf-8")

        if not isinstance(content, str):
            raise EmbeddingError(
                f"TextEmbedder expects string content, got {type(content).__name__}",
                self._model_name,
            )

        try:
            embedding = self._model.encode(content, convert_to_numpy=True)
            return embedding.tolist()
        except Exception as e:
            raise EmbeddingError(str(e), self._model_name) from e

    def embed_batch(self, contents: list[bytes | str]) -> list[list[float]]:
        texts = []
        for content in contents:
            if isinstance(content, bytes):
                content = content.decode("utf-8")
            texts.append(content)

        try:
            embeddings = self._model.encode(texts, convert_to_numpy=True)
            return [emb.tolist() for emb in embeddings]
        except Exception as e:
            raise EmbeddingError(str(e), self._model_name) from e

    @property
    def dimensions(self) -> int:
        return self._dimensions

    @property
    def model_name(self) -> str:
        return self._model_name

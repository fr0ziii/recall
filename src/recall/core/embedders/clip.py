"""CLIP embedder for image content."""

import io
from functools import cached_property

from recall.core.embedders.base import BaseEmbedder
from recall.models.errors import EmbeddingError

MODEL_DIMENSIONS = {
    "clip-ViT-B-32": 512,
    "clip-ViT-B-16": 512,
    "clip-ViT-L-14": 768,
}


class CLIPEmbedder(BaseEmbedder):
    """CLIP embedder for images using sentence-transformers."""

    def __init__(self, model_name: str = "clip-ViT-B-32"):
        self._model_name = model_name
        self._dimensions = MODEL_DIMENSIONS.get(model_name, 512)

    @cached_property
    def _model(self):
        from sentence_transformers import SentenceTransformer

        return SentenceTransformer(self._model_name)

    def embed(self, content: bytes | str) -> list[float]:
        from PIL import Image

        try:
            if isinstance(content, str):
                if content.startswith(("http://", "https://", "s3://")):
                    raise EmbeddingError(
                        "CLIPEmbedder received URI, content must be downloaded first",
                        self._model_name,
                    )
                content = content.encode("utf-8")

            img = Image.open(io.BytesIO(content))
            embedding = self._model.encode(img, convert_to_numpy=True)
            return embedding.tolist()
        except EmbeddingError:
            raise
        except Exception as e:
            raise EmbeddingError(str(e), self._model_name) from e

    def embed_batch(self, contents: list[bytes | str]) -> list[list[float]]:
        from PIL import Image

        images = []
        for content in contents:
            if isinstance(content, str):
                content = content.encode("utf-8")
            images.append(Image.open(io.BytesIO(content)))

        try:
            embeddings = self._model.encode(images, convert_to_numpy=True)
            return [emb.tolist() for emb in embeddings]
        except Exception as e:
            raise EmbeddingError(str(e), self._model_name) from e

    @property
    def dimensions(self) -> int:
        return self._dimensions

    @property
    def model_name(self) -> str:
        return self._model_name

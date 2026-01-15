"""Tests for embedder factory and implementations."""

from unittest.mock import MagicMock, patch

import numpy as np
import pytest

from recall.core.embedders.clip import CLIPEmbedder
from recall.core.embedders.factory import EmbedderFactory
from recall.core.embedders.text import TextEmbedder
from recall.models.collection import Modality
from recall.models.errors import EmbeddingError, UnsupportedModelError


@pytest.mark.unit
class TestEmbedderFactory:
    """Test cases for EmbedderFactory."""

    @pytest.fixture(autouse=True)
    def clear_cache(self):
        """Clear the factory cache before each test."""
        EmbedderFactory.create.cache_clear()
        yield

    def test_supported_models_returns_list(self):
        models = EmbedderFactory.supported_models()
        assert isinstance(models, list)
        assert len(models) > 0
        assert "all-MiniLM-L6-v2" in models
        assert "clip-ViT-B-32" in models

    def test_supported_models_is_sorted(self):
        models = EmbedderFactory.supported_models()
        assert models == sorted(models)

    def test_create_text_embedder(self):
        embedder = EmbedderFactory.create("all-MiniLM-L6-v2")
        assert isinstance(embedder, TextEmbedder)
        assert embedder.dimensions == 384

    def test_create_clip_embedder(self):
        embedder = EmbedderFactory.create("clip-ViT-B-32")
        assert isinstance(embedder, CLIPEmbedder)
        assert embedder.dimensions == 512

    def test_create_unsupported_model_raises(self):
        with pytest.raises(UnsupportedModelError) as exc_info:
            EmbedderFactory.create("unknown-model")
        assert "unknown-model" in str(exc_info.value)

    @pytest.mark.parametrize(
        "model,expected_modality",
        [
            ("all-MiniLM-L6-v2", Modality.TEXT),
            ("all-mpnet-base-v2", Modality.TEXT),
            ("clip-ViT-B-32", Modality.IMAGE),
            ("clip-ViT-L-14", Modality.IMAGE),
        ],
    )
    def test_get_modality(self, model, expected_modality):
        modality = EmbedderFactory.get_modality(model)
        assert modality == expected_modality

    def test_get_modality_unsupported_raises(self):
        with pytest.raises(UnsupportedModelError):
            EmbedderFactory.get_modality("unknown")

    def test_create_for_modality_text(self):
        embedder = EmbedderFactory.create_for_modality(Modality.TEXT)
        assert isinstance(embedder, TextEmbedder)

    def test_create_for_modality_image(self):
        embedder = EmbedderFactory.create_for_modality(Modality.IMAGE)
        assert isinstance(embedder, CLIPEmbedder)

    def test_create_for_modality_with_specific_model(self):
        embedder = EmbedderFactory.create_for_modality(
            Modality.TEXT, model_name="all-mpnet-base-v2"
        )
        assert embedder.model_name == "all-mpnet-base-v2"

    def test_factory_caches_instances(self):
        embedder1 = EmbedderFactory.create("all-MiniLM-L6-v2")
        embedder2 = EmbedderFactory.create("all-MiniLM-L6-v2")
        assert embedder1 is embedder2


@pytest.mark.unit
class TestTextEmbedder:
    """Test cases for TextEmbedder."""

    def test_model_name_property(self):
        embedder = TextEmbedder("all-MiniLM-L6-v2")
        assert embedder.model_name == "all-MiniLM-L6-v2"

    def test_dimensions_property(self):
        embedder = TextEmbedder("all-MiniLM-L6-v2")
        assert embedder.dimensions == 384

    @pytest.mark.parametrize(
        "model,expected_dim",
        [
            ("all-MiniLM-L6-v2", 384),
            ("all-mpnet-base-v2", 768),
            ("paraphrase-MiniLM-L6-v2", 384),
        ],
    )
    def test_dimensions_per_model(self, model, expected_dim):
        embedder = TextEmbedder(model)
        assert embedder.dimensions == expected_dim

    def test_embed_string_content(self):
        with patch("sentence_transformers.SentenceTransformer") as mock:
            instance = MagicMock()
            instance.encode.return_value = MagicMock(tolist=lambda: [0.1] * 384)
            mock.return_value = instance

            embedder = TextEmbedder("all-MiniLM-L6-v2")
            result = embedder.embed("test content")
            assert isinstance(result, list)
            assert len(result) == 384

    def test_embed_bytes_content(self):
        with patch("sentence_transformers.SentenceTransformer") as mock:
            instance = MagicMock()
            instance.encode.return_value = MagicMock(tolist=lambda: [0.1] * 384)
            mock.return_value = instance

            embedder = TextEmbedder("all-MiniLM-L6-v2")
            result = embedder.embed(b"test content")
            assert isinstance(result, list)

    def test_embed_batch(self):
        with patch("sentence_transformers.SentenceTransformer") as mock:
            instance = MagicMock()
            instance.encode.return_value = np.array([[0.1] * 384, [0.2] * 384])
            mock.return_value = instance

            embedder = TextEmbedder("all-MiniLM-L6-v2")
            results = embedder.embed_batch(["text1", "text2"])

            assert len(results) == 2
            assert all(len(r) == 384 for r in results)

    def test_embed_invalid_type_raises(self):
        with patch("sentence_transformers.SentenceTransformer") as mock:
            instance = MagicMock()
            mock.return_value = instance

            embedder = TextEmbedder("all-MiniLM-L6-v2")
            with pytest.raises(EmbeddingError, match="expects string content"):
                embedder.embed(12345)


@pytest.mark.unit
class TestCLIPEmbedder:
    """Test cases for CLIPEmbedder."""

    def test_model_name_property(self):
        embedder = CLIPEmbedder("clip-ViT-B-32")
        assert embedder.model_name == "clip-ViT-B-32"

    def test_dimensions_property(self):
        embedder = CLIPEmbedder("clip-ViT-B-32")
        assert embedder.dimensions == 512

    @pytest.mark.parametrize(
        "model,expected_dim",
        [
            ("clip-ViT-B-32", 512),
            ("clip-ViT-B-16", 512),
            ("clip-ViT-L-14", 768),
        ],
    )
    def test_dimensions_per_model(self, model, expected_dim):
        embedder = CLIPEmbedder(model)
        assert embedder.dimensions == expected_dim

    def test_embed_rejects_uri_string(self):
        with patch("sentence_transformers.SentenceTransformer") as mock:
            instance = MagicMock()
            mock.return_value = instance

            embedder = CLIPEmbedder("clip-ViT-B-32")
            with pytest.raises(EmbeddingError, match="content must be downloaded first"):
                embedder.embed("https://example.com/image.jpg")

    def test_embed_rejects_s3_uri(self):
        with patch("sentence_transformers.SentenceTransformer") as mock:
            instance = MagicMock()
            mock.return_value = instance

            embedder = CLIPEmbedder("clip-ViT-B-32")
            with pytest.raises(EmbeddingError, match="content must be downloaded first"):
                embedder.embed("s3://bucket/image.jpg")

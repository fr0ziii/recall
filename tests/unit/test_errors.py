"""Tests for custom error classes."""

import pytest

from recall.models.errors import (
    CollectionNotFoundError,
    EmbeddingError,
    RecallError,
    SchemaValidationError,
    UnsupportedModelError,
    VectorDBError,
)


@pytest.mark.unit
class TestRecallError:
    """Test cases for base RecallError."""

    def test_message_and_details(self):
        error = RecallError("Something went wrong", {"key": "value"})
        assert error.message == "Something went wrong"
        assert error.details == {"key": "value"}
        assert str(error) == "Something went wrong"

    def test_default_details(self):
        error = RecallError("Error message")
        assert error.details == {}


@pytest.mark.unit
class TestCollectionNotFoundError:
    """Test cases for CollectionNotFoundError."""

    def test_error_message(self):
        error = CollectionNotFoundError("my-collection")
        assert "my-collection" in error.message
        assert error.details["collection_name"] == "my-collection"

    def test_can_be_raised_and_caught(self):
        with pytest.raises(CollectionNotFoundError) as exc_info:
            raise CollectionNotFoundError("test-collection")
        assert "test-collection" in str(exc_info.value)


@pytest.mark.unit
class TestSchemaValidationError:
    """Test cases for SchemaValidationError."""

    def test_error_with_field(self):
        error = SchemaValidationError("Invalid field type", field="price")
        assert "Invalid field type" in error.message
        assert error.details["field"] == "price"

    def test_error_without_field(self):
        error = SchemaValidationError("Schema validation failed")
        assert error.details == {}


@pytest.mark.unit
class TestUnsupportedModelError:
    """Test cases for UnsupportedModelError."""

    def test_error_with_supported_models(self):
        error = UnsupportedModelError("unknown-model", ["model-a", "model-b"])
        assert "unknown-model" in error.message
        assert error.details["model_name"] == "unknown-model"
        assert error.details["supported_models"] == ["model-a", "model-b"]

    def test_error_without_supported_models(self):
        error = UnsupportedModelError("bad-model")
        assert error.details["supported_models"] == []


@pytest.mark.unit
class TestEmbeddingError:
    """Test cases for EmbeddingError."""

    def test_error_with_model_name(self):
        error = EmbeddingError("Failed to embed", model_name="all-MiniLM-L6-v2")
        assert "Failed to embed" in error.message
        assert error.details["model_name"] == "all-MiniLM-L6-v2"

    def test_error_without_model_name(self):
        error = EmbeddingError("Embedding failed")
        assert error.details == {}


@pytest.mark.unit
class TestVectorDBError:
    """Test cases for VectorDBError."""

    def test_error_with_operation(self):
        error = VectorDBError("Connection failed", operation="search")
        assert "Connection failed" in error.message
        assert error.details["operation"] == "search"

    def test_error_without_operation(self):
        error = VectorDBError("Unknown error")
        assert error.details == {}


@pytest.mark.unit
class TestErrorInheritance:
    """Test that all errors inherit from RecallError."""

    @pytest.mark.parametrize(
        "error_cls,args",
        [
            (CollectionNotFoundError, ("test",)),
            (SchemaValidationError, ("msg",)),
            (UnsupportedModelError, ("model",)),
            (EmbeddingError, ("msg",)),
            (VectorDBError, ("msg",)),
        ],
    )
    def test_is_recall_error(self, error_cls, args):
        error = error_cls(*args)
        assert isinstance(error, RecallError)
        assert isinstance(error, Exception)

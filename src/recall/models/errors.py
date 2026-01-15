"""Typed exceptions for Recall."""


class RecallError(Exception):
    """Base exception for all Recall errors."""

    def __init__(self, message: str, details: dict | None = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}


class CollectionNotFoundError(RecallError):
    """Raised when a collection does not exist."""

    def __init__(self, collection_name: str):
        super().__init__(
            f"Collection '{collection_name}' not found",
            {"collection_name": collection_name},
        )


class SchemaValidationError(RecallError):
    """Raised when document payload does not match collection schema."""

    def __init__(self, message: str, field: str | None = None):
        super().__init__(message, {"field": field} if field else {})


class UnsupportedModelError(RecallError):
    """Raised when an unsupported embedding model is requested."""

    def __init__(self, model_name: str, supported_models: list[str] | None = None):
        super().__init__(
            f"Model '{model_name}' is not supported",
            {"model_name": model_name, "supported_models": supported_models or []},
        )


class EmbeddingError(RecallError):
    """Raised when embedding generation fails."""

    def __init__(self, message: str, model_name: str | None = None):
        super().__init__(message, {"model_name": model_name} if model_name else {})


class VectorDBError(RecallError):
    """Raised when vector database operations fail."""

    def __init__(self, message: str, operation: str | None = None):
        super().__init__(message, {"operation": operation} if operation else {})

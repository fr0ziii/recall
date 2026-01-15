"""Dynamic schema validation for document payloads."""

from functools import lru_cache
from typing import Any

from pydantic import ValidationError, create_model

from recall.models.collection import FieldType, IndexSchema
from recall.models.errors import SchemaValidationError

FIELD_TYPE_MAP: dict[FieldType, type] = {
    FieldType.FLOAT: float,
    FieldType.INT: int,
    FieldType.KEYWORD: str,
    FieldType.BOOL: bool,
    FieldType.TEXT: str,
}


def _schema_to_tuple(schema: IndexSchema) -> tuple[tuple[str, str], ...]:
    """Convert schema dict to hashable tuple for caching."""
    return tuple(sorted((k, v.value if isinstance(v, FieldType) else v) for k, v in schema.items()))


@lru_cache(maxsize=128)
def _build_model_cached(schema_tuple: tuple[tuple[str, str], ...]) -> type:
    """Build and cache a Pydantic model from schema tuple."""
    fields = {}
    for field_name, field_type_str in schema_tuple:
        field_type = FieldType(field_type_str)
        python_type = FIELD_TYPE_MAP[field_type]
        fields[field_name] = (python_type, ...)
    return create_model("DynamicPayload", **fields)


def build_payload_model(schema: IndexSchema) -> type:
    """Dynamically create a Pydantic model from collection schema.

    Args:
        schema: Collection index schema mapping field names to types

    Returns:
        Pydantic model class for payload validation
    """
    if not schema:
        return create_model("EmptyPayload")
    schema_tuple = _schema_to_tuple(schema)
    return _build_model_cached(schema_tuple)


def validate_payload(payload: dict[str, Any], schema: IndexSchema, doc_id: str) -> None:
    """Validate a document payload against the collection schema.

    Args:
        payload: Document payload to validate
        schema: Collection index schema
        doc_id: Document ID for error reporting

    Raises:
        SchemaValidationError: If payload doesn't match schema
    """
    if not schema:
        return

    model = build_payload_model(schema)
    try:
        model.model_validate(payload)
    except ValidationError as e:
        errors = []
        for error in e.errors():
            field = ".".join(str(loc) for loc in error["loc"])
            errors.append(f"{field}: {error['msg']}")
        raise SchemaValidationError(
            f"Document '{doc_id}' payload validation failed: {'; '.join(errors)}"
        ) from e

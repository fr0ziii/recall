"""Tests for dynamic schema validation."""

import pytest

from recall.models.collection import FieldType
from recall.models.errors import SchemaValidationError
from recall.services.schema_validator import build_payload_model, validate_payload


class TestBuildPayloadModel:
    """Tests for build_payload_model."""

    def test_empty_schema_returns_empty_model(self) -> None:
        model = build_payload_model({})
        instance = model()
        assert instance is not None

    def test_single_field_float(self) -> None:
        schema = {"price": FieldType.FLOAT}
        model = build_payload_model(schema)
        instance = model(price=19.99)
        assert instance.price == 19.99

    def test_single_field_int(self) -> None:
        schema = {"count": FieldType.INT}
        model = build_payload_model(schema)
        instance = model(count=42)
        assert instance.count == 42

    def test_single_field_keyword(self) -> None:
        schema = {"category": FieldType.KEYWORD}
        model = build_payload_model(schema)
        instance = model(category="electronics")
        assert instance.category == "electronics"

    def test_single_field_bool(self) -> None:
        schema = {"active": FieldType.BOOL}
        model = build_payload_model(schema)
        instance = model(active=True)
        assert instance.active is True

    def test_single_field_text(self) -> None:
        schema = {"description": FieldType.TEXT}
        model = build_payload_model(schema)
        instance = model(description="test")
        assert instance.description == "test"

    def test_multiple_fields(self) -> None:
        schema = {
            "price": FieldType.FLOAT,
            "quantity": FieldType.INT,
            "category": FieldType.KEYWORD,
        }
        model = build_payload_model(schema)
        instance = model(price=9.99, quantity=5, category="books")
        assert instance.price == 9.99
        assert instance.quantity == 5
        assert instance.category == "books"

    def test_missing_required_field_raises(self) -> None:
        schema = {"price": FieldType.FLOAT}
        model = build_payload_model(schema)
        with pytest.raises(ValueError):
            model()

    def test_wrong_type_raises(self) -> None:
        schema = {"price": FieldType.FLOAT}
        model = build_payload_model(schema)
        with pytest.raises(ValueError):
            model(price="not a float")


class TestValidatePayload:
    """Tests for validate_payload."""

    def test_empty_schema_accepts_any_payload(self) -> None:
        validate_payload({"anything": "goes"}, {}, "doc-1")

    def test_valid_payload_passes(self) -> None:
        schema = {"price": FieldType.FLOAT, "category": FieldType.KEYWORD}
        payload = {"price": 19.99, "category": "shoes"}
        validate_payload(payload, schema, "doc-1")

    def test_missing_field_raises_schema_error(self) -> None:
        schema = {"price": FieldType.FLOAT}
        payload = {}
        with pytest.raises(SchemaValidationError) as exc_info:
            validate_payload(payload, schema, "doc-1")
        assert "doc-1" in exc_info.value.message
        assert "price" in exc_info.value.message

    def test_wrong_type_raises_schema_error(self) -> None:
        schema = {"price": FieldType.FLOAT}
        payload = {"price": "not a number"}
        with pytest.raises(SchemaValidationError) as exc_info:
            validate_payload(payload, schema, "doc-1")
        assert "doc-1" in exc_info.value.message

    def test_extra_fields_allowed(self) -> None:
        schema = {"price": FieldType.FLOAT}
        payload = {"price": 9.99, "extra": "field"}
        validate_payload(payload, schema, "doc-1")

    def test_multiple_errors_in_message(self) -> None:
        schema = {"price": FieldType.FLOAT, "count": FieldType.INT}
        payload = {}
        with pytest.raises(SchemaValidationError) as exc_info:
            validate_payload(payload, schema, "doc-1")
        assert "price" in exc_info.value.message
        assert "count" in exc_info.value.message

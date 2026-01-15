"""Tests for the DSL transpiler."""

import pytest
from qdrant_client.models import FieldCondition, Filter, MatchValue, Range

from recall.core.transpiler.qdrant import QdrantTranspiler
from recall.models.search import (
    AndFilter,
    EqCondition,
    GtCondition,
    GteCondition,
    InCondition,
    LtCondition,
    LteCondition,
    NeqCondition,
    OrFilter,
)


@pytest.mark.unit
class TestQdrantTranspiler:
    """Test cases for QdrantTranspiler."""

    def test_transpile_none_returns_none(self):
        result = QdrantTranspiler.transpile(None)
        assert result is None

    def test_transpile_eq_condition(self):
        condition = EqCondition(field="category", value="shoes")
        result = QdrantTranspiler.transpile(condition)

        assert result is not None
        assert len(result.must) == 1
        assert result.must[0].key == "category"
        assert result.must[0].match.value == "shoes"

    def test_transpile_neq_condition(self):
        condition = NeqCondition(field="status", value="deleted")
        result = QdrantTranspiler.transpile(condition)

        assert result is not None
        assert len(result.must_not) == 1
        assert result.must_not[0].key == "status"
        assert result.must_not[0].match.value == "deleted"

    def test_transpile_lt_condition(self):
        condition = LtCondition(field="price", value=100.0)
        result = QdrantTranspiler.transpile(condition)

        assert result is not None
        assert len(result.must) == 1
        assert result.must[0].key == "price"
        assert result.must[0].range.lt == 100.0

    def test_transpile_lte_condition(self):
        condition = LteCondition(field="price", value=100.0)
        result = QdrantTranspiler.transpile(condition)

        assert result is not None
        assert result.must[0].range.lte == 100.0

    def test_transpile_gt_condition(self):
        condition = GtCondition(field="rating", value=4.0)
        result = QdrantTranspiler.transpile(condition)

        assert result is not None
        assert len(result.must) == 1
        assert result.must[0].key == "rating"
        assert result.must[0].range.gt == 4.0

    def test_transpile_gte_condition(self):
        condition = GteCondition(field="rating", value=4.0)
        result = QdrantTranspiler.transpile(condition)

        assert result is not None
        assert result.must[0].range.gte == 4.0

    def test_transpile_in_condition(self):
        condition = InCondition(field="color", value=["red", "blue", "green"])
        result = QdrantTranspiler.transpile(condition)

        assert result is not None
        assert len(result.must) == 1
        assert result.must[0].key == "color"
        assert result.must[0].match.any == ["red", "blue", "green"]

    def test_transpile_and_filter(self):
        condition = AndFilter(
            conditions=[
                EqCondition(field="category", value="shoes"),
                LtCondition(field="price", value=200),
            ]
        )
        result = QdrantTranspiler.transpile(condition)

        assert result is not None
        assert len(result.must) == 2

    def test_transpile_or_filter(self):
        condition = OrFilter(
            conditions=[
                EqCondition(field="color", value="red"),
                EqCondition(field="color", value="blue"),
            ]
        )
        result = QdrantTranspiler.transpile(condition)

        assert result is not None
        assert len(result.should) == 2

    def test_transpile_nested_and_or(self):
        condition = AndFilter(
            conditions=[
                EqCondition(field="category", value="shoes"),
                OrFilter(
                    conditions=[
                        EqCondition(field="color", value="red"),
                        EqCondition(field="color", value="blue"),
                    ]
                ),
            ]
        )
        result = QdrantTranspiler.transpile(condition)

        assert result is not None
        assert result.must is not None

    def test_transpile_and_with_neq(self):
        condition = AndFilter(
            conditions=[
                EqCondition(field="category", value="shoes"),
                NeqCondition(field="status", value="deleted"),
            ]
        )
        result = QdrantTranspiler.transpile(condition)

        assert result.must is not None
        assert result.must_not is not None

    @pytest.mark.parametrize(
        "value_type,value",
        [
            ("string", "test"),
            ("int", 42),
            ("float", 3.14),
            ("bool", True),
        ],
    )
    def test_transpile_eq_various_types(self, value_type, value):
        condition = EqCondition(field="field", value=value)
        result = QdrantTranspiler.transpile(condition)
        assert result.must[0].match.value == value

    def test_transpile_deeply_nested(self):
        condition = AndFilter(
            conditions=[
                OrFilter(
                    conditions=[
                        AndFilter(
                            conditions=[
                                EqCondition(field="a", value=1),
                                EqCondition(field="b", value=2),
                            ]
                        ),
                        EqCondition(field="c", value=3),
                    ]
                ),
                GtCondition(field="d", value=0),
            ]
        )
        result = QdrantTranspiler.transpile(condition)
        assert result is not None

    def test_transpile_unknown_operation_raises(self):
        class UnknownCondition:
            op = "UNKNOWN"

        with pytest.raises(ValueError, match="Unknown operation"):
            QdrantTranspiler._transpile_condition(UnknownCondition())

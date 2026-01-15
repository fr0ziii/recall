"""Performance benchmark tests for critical paths."""

import time

import pytest

from recall.core.transpiler.qdrant import QdrantTranspiler
from recall.models.search import (
    AndFilter,
    EqCondition,
    GtCondition,
    LtCondition,
    OrFilter,
)


@pytest.mark.slow
class TestTranspilerPerformance:
    """Benchmark tests for the DSL transpiler."""

    def test_simple_condition_performance(self):
        condition = EqCondition(field="category", value="shoes")

        start = time.perf_counter()
        for _ in range(10000):
            QdrantTranspiler.transpile(condition)
        elapsed = time.perf_counter() - start

        assert elapsed < 1.0, f"10k simple transpilations took {elapsed:.2f}s (expected <1s)"

    def test_complex_filter_performance(self):
        condition = AndFilter(
            conditions=[
                EqCondition(field="category", value="shoes"),
                OrFilter(
                    conditions=[
                        EqCondition(field="color", value="red"),
                        EqCondition(field="color", value="blue"),
                        EqCondition(field="color", value="green"),
                    ]
                ),
                LtCondition(field="price", value=200),
                GtCondition(field="rating", value=4),
            ]
        )

        start = time.perf_counter()
        for _ in range(1000):
            QdrantTranspiler.transpile(condition)
        elapsed = time.perf_counter() - start

        assert elapsed < 1.0, f"1k complex transpilations took {elapsed:.2f}s (expected <1s)"

    def test_deeply_nested_filter_performance(self):
        def create_nested(depth: int):
            if depth == 0:
                return EqCondition(field="f", value="v")
            return AndFilter(
                conditions=[
                    create_nested(depth - 1),
                    OrFilter(conditions=[EqCondition(field="x", value="y")] * 3),
                ]
            )

        condition = create_nested(5)

        start = time.perf_counter()
        for _ in range(100):
            QdrantTranspiler.transpile(condition)
        elapsed = time.perf_counter() - start

        assert elapsed < 1.0, f"100 deeply nested transpilations took {elapsed:.2f}s"


@pytest.mark.slow
class TestEmbedderCaching:
    """Test embedder factory caching effectiveness."""

    def test_factory_cache_performance(self):
        from recall.core.embedders.factory import EmbedderFactory

        EmbedderFactory.create.cache_clear()

        start = time.perf_counter()
        for _ in range(10000):
            EmbedderFactory.create("all-MiniLM-L6-v2")
        elapsed = time.perf_counter() - start

        assert elapsed < 0.1, f"10k cached factory calls took {elapsed:.2f}s (expected <0.1s)"


@pytest.mark.slow
class TestModelValidation:
    """Benchmark Pydantic model validation."""

    def test_search_request_validation_performance(self):
        from recall.models.search import SearchRequest

        start = time.perf_counter()
        for _ in range(10000):
            SearchRequest(
                query="test query",
                filter=EqCondition(field="category", value="shoes"),
                limit=10,
            )
        elapsed = time.perf_counter() - start

        assert elapsed < 2.0, f"10k SearchRequest validations took {elapsed:.2f}s"

    def test_document_validation_performance(self):
        from recall.models.document import Document, IngestRequest

        start = time.perf_counter()
        for _ in range(1000):
            IngestRequest(
                documents=[
                    Document(id=f"doc-{i}", content_raw=f"Content {i}")
                    for i in range(10)
                ]
            )
        elapsed = time.perf_counter() - start

        assert elapsed < 2.0, f"1k IngestRequest validations took {elapsed:.2f}s"

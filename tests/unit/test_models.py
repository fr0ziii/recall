"""Tests for Pydantic models validation."""

import pytest
from pydantic import ValidationError

from recall.models.collection import (
    Collection,
    CollectionResponse,
    CreateCollectionRequest,
    EmbeddingConfig,
    FieldType,
    Modality,
)
from recall.models.document import Document, IngestRequest, IngestResponse
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
    SearchRequest,
    SearchResponse,
    SearchResult,
)


@pytest.mark.unit
class TestEmbeddingConfig:
    """Test cases for EmbeddingConfig model."""

    def test_valid_text_config(self):
        config = EmbeddingConfig(model="all-MiniLM-L6-v2", modality=Modality.TEXT)
        assert config.model == "all-MiniLM-L6-v2"
        assert config.modality == Modality.TEXT

    def test_valid_image_config(self):
        config = EmbeddingConfig(model="clip-ViT-B-32", modality=Modality.IMAGE)
        assert config.model == "clip-ViT-B-32"
        assert config.modality == Modality.IMAGE

    def test_missing_model_raises(self):
        with pytest.raises(ValidationError):
            EmbeddingConfig(modality=Modality.TEXT)

    def test_missing_modality_raises(self):
        with pytest.raises(ValidationError):
            EmbeddingConfig(model="all-MiniLM-L6-v2")


@pytest.mark.unit
class TestCollection:
    """Test cases for Collection model."""

    def test_valid_collection(self):
        collection = Collection(
            name="test-collection",
            embedding_config=EmbeddingConfig(model="all-MiniLM-L6-v2", modality=Modality.TEXT),
            index_schema={"category": FieldType.KEYWORD},
        )
        assert collection.name == "test-collection"

    @pytest.mark.parametrize(
        "name",
        [
            "valid-name",
            "valid_name",
            "valid123",
            "a",
        ],
    )
    def test_valid_collection_names(self, name):
        collection = Collection(
            name=name,
            embedding_config=EmbeddingConfig(model="all-MiniLM-L6-v2", modality=Modality.TEXT),
        )
        assert collection.name == name

    @pytest.mark.parametrize(
        "name",
        [
            "",
            "Invalid Name",
            "UPPERCASE",
            "special@char",
            "a" * 129,
        ],
    )
    def test_invalid_collection_names(self, name):
        with pytest.raises(ValidationError):
            Collection(
                name=name,
                embedding_config=EmbeddingConfig(model="all-MiniLM-L6-v2", modality=Modality.TEXT),
            )

    def test_empty_index_schema_default(self):
        collection = Collection(
            name="test",
            embedding_config=EmbeddingConfig(model="all-MiniLM-L6-v2", modality=Modality.TEXT),
        )
        assert collection.index_schema == {}


@pytest.mark.unit
class TestCreateCollectionRequest:
    """Test cases for CreateCollectionRequest model."""

    def test_valid_request(self):
        request = CreateCollectionRequest(
            name="new-collection",
            embedding_config=EmbeddingConfig(model="all-MiniLM-L6-v2", modality=Modality.TEXT),
            index_schema={"price": FieldType.FLOAT},
        )
        assert request.name == "new-collection"
        assert request.index_schema["price"] == FieldType.FLOAT


@pytest.mark.unit
class TestDocument:
    """Test cases for Document model."""

    def test_document_with_raw_content(self):
        doc = Document(id="doc-1", content_raw="Hello world", payload={"key": "value"})
        assert doc.get_content_source() == "Hello world"

    def test_document_with_uri(self):
        doc = Document(id="doc-2", content_uri="https://example.com/file.txt")
        assert doc.get_content_source() == "https://example.com/file.txt"

    def test_document_prefers_raw_over_uri(self):
        doc = Document(
            id="doc-3",
            content_raw="Raw content",
            content_uri="https://example.com/file.txt",
        )
        assert doc.get_content_source() == "Raw content"

    def test_document_no_content_returns_none(self):
        doc = Document(id="doc-4")
        assert doc.get_content_source() is None

    def test_document_uuid_id(self):
        from uuid import uuid4

        uid = uuid4()
        doc = Document(id=uid, content_raw="test")
        assert doc.id == uid


@pytest.mark.unit
class TestIngestRequest:
    """Test cases for IngestRequest model."""

    def test_valid_request(self):
        request = IngestRequest(
            documents=[Document(id="doc-1", content_raw="content")]
        )
        assert len(request.documents) == 1

    def test_empty_documents_raises(self):
        with pytest.raises(ValidationError):
            IngestRequest(documents=[])

    def test_max_documents_enforced(self):
        docs = [Document(id=f"doc-{i}", content_raw="x") for i in range(101)]
        with pytest.raises(ValidationError):
            IngestRequest(documents=docs)


@pytest.mark.unit
class TestFilterConditions:
    """Test cases for filter condition models."""

    def test_eq_condition(self):
        cond = EqCondition(field="category", value="shoes")
        assert cond.op == "EQ"
        assert cond.field == "category"
        assert cond.value == "shoes"

    def test_neq_condition(self):
        cond = NeqCondition(field="status", value="deleted")
        assert cond.op == "NEQ"

    @pytest.mark.parametrize(
        "condition_cls,op,value",
        [
            (LtCondition, "LT", 100),
            (LteCondition, "LTE", 100),
            (GtCondition, "GT", 0),
            (GteCondition, "GTE", 0),
        ],
    )
    def test_range_conditions(self, condition_cls, op, value):
        cond = condition_cls(field="price", value=value)
        assert cond.op == op
        assert cond.value == value

    def test_in_condition(self):
        cond = InCondition(field="color", value=["red", "blue", "green"])
        assert cond.op == "IN"
        assert len(cond.value) == 3

    def test_and_filter(self):
        filt = AndFilter(
            conditions=[
                EqCondition(field="category", value="shoes"),
                LtCondition(field="price", value=200),
            ]
        )
        assert filt.op == "AND"
        assert len(filt.conditions) == 2

    def test_or_filter(self):
        filt = OrFilter(
            conditions=[
                EqCondition(field="color", value="red"),
                EqCondition(field="color", value="blue"),
            ]
        )
        assert filt.op == "OR"
        assert len(filt.conditions) == 2

    def test_nested_filters(self):
        filt = AndFilter(
            conditions=[
                EqCondition(field="category", value="shoes"),
                OrFilter(
                    conditions=[
                        EqCondition(field="brand", value="nike"),
                        EqCondition(field="brand", value="adidas"),
                    ]
                ),
            ]
        )
        assert filt.op == "AND"
        assert filt.conditions[1].op == "OR"


@pytest.mark.unit
class TestSearchRequest:
    """Test cases for SearchRequest model."""

    def test_minimal_request(self):
        request = SearchRequest(query="running shoes")
        assert request.query == "running shoes"
        assert request.limit == 10
        assert request.filter is None
        assert request.with_payload is True
        assert request.with_vectors is False

    def test_request_with_filter(self):
        request = SearchRequest(
            query="shoes",
            filter=EqCondition(field="category", value="footwear"),
            limit=20,
        )
        assert request.filter.op == "EQ"
        assert request.limit == 20

    @pytest.mark.parametrize("limit", [0, -1, 101])
    def test_invalid_limit(self, limit):
        with pytest.raises(ValidationError):
            SearchRequest(query="test", limit=limit)


@pytest.mark.unit
class TestSearchResponse:
    """Test cases for SearchResponse model."""

    def test_empty_results(self):
        response = SearchResponse(results=[], query="test", count=0)
        assert len(response.results) == 0

    def test_with_results(self):
        results = [
            SearchResult(id="1", score=0.95, payload={"name": "item1"}),
            SearchResult(id="2", score=0.85, payload={"name": "item2"}),
        ]
        response = SearchResponse(results=results, query="test", count=2)
        assert response.count == 2
        assert response.results[0].score > response.results[1].score

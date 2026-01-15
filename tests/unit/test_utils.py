"""Tests for core utility functions."""

from recall.core.utils import deterministic_vector_id


class TestDeterministicVectorId:
    """Tests for deterministic UUID generation."""

    def test_same_inputs_produce_same_id(self) -> None:
        id1 = deterministic_vector_id("products", "doc-123")
        id2 = deterministic_vector_id("products", "doc-123")
        assert id1 == id2

    def test_different_doc_ids_produce_different_ids(self) -> None:
        id1 = deterministic_vector_id("products", "doc-123")
        id2 = deterministic_vector_id("products", "doc-456")
        assert id1 != id2

    def test_different_collections_produce_different_ids(self) -> None:
        id1 = deterministic_vector_id("products", "doc-123")
        id2 = deterministic_vector_id("users", "doc-123")
        assert id1 != id2

    def test_returns_valid_uuid_format(self) -> None:
        result = deterministic_vector_id("test", "doc-1")
        parts = result.split("-")
        assert len(parts) == 5
        assert len(parts[0]) == 8
        assert len(parts[1]) == 4
        assert len(parts[2]) == 4
        assert len(parts[3]) == 4
        assert len(parts[4]) == 12

    def test_handles_special_characters_in_doc_id(self) -> None:
        id1 = deterministic_vector_id("test", "doc/with/slashes")
        id2 = deterministic_vector_id("test", "doc/with/slashes")
        assert id1 == id2

    def test_handles_unicode_doc_id(self) -> None:
        id1 = deterministic_vector_id("test", "doc-with-emoji-🎉")
        id2 = deterministic_vector_id("test", "doc-with-emoji-🎉")
        assert id1 == id2

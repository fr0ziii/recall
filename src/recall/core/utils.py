"""Core utility functions."""

import uuid

RECALL_NAMESPACE = uuid.UUID("a3d5e7f9-1b2c-4d6e-8f0a-9c8b7d6e5f4a")


def deterministic_vector_id(collection_name: str, doc_id: str) -> str:
    """Generate deterministic UUID for Qdrant point ID.

    Uses UUID5 with a fixed namespace to ensure the same collection/doc_id
    pair always produces the same vector ID. This enables idempotent upserts.

    Args:
        collection_name: Name of the collection
        doc_id: Original document identifier

    Returns:
        Deterministic UUID string
    """
    return str(uuid.uuid5(RECALL_NAMESPACE, f"{collection_name}:{doc_id}"))

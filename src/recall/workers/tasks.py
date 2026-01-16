"""Arq worker tasks for document embedding."""

from typing import Any

import httpx
from arq.connections import RedisSettings
from redis.asyncio import Redis

from recall.config import get_settings
from recall.core.embedders.factory import EmbedderFactory
from recall.core.utils import deterministic_vector_id
from recall.core.vectordb.base import Point
from recall.core.vectordb.qdrant import QdrantAdapter
from recall.services.registry import SchemaRegistry


async def startup(ctx: dict[str, Any]) -> None:
    """Initialize worker context on startup."""
    settings = get_settings()

    ctx["redis"] = Redis.from_url(settings.redis_url)
    ctx["registry"] = SchemaRegistry(ctx["redis"])
    ctx["vectordb"] = QdrantAdapter(settings.qdrant_url)
    ctx["http_client"] = httpx.AsyncClient()


async def shutdown(ctx: dict[str, Any]) -> None:
    """Cleanup worker context on shutdown."""
    if "http_client" in ctx:
        await ctx["http_client"].aclose()
    if "vectordb" in ctx:
        await ctx["vectordb"].close()
    if "redis" in ctx:
        await ctx["redis"].close()


async def embed_document(
    ctx: dict[str, Any],
    collection_name: str,
    doc_id: str,
    content_uri: str | None = None,
    content_raw: str | None = None,
    payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Embed a document and store in vector database.

    Args:
        ctx: Worker context with dependencies
        collection_name: Target collection
        doc_id: Document identifier
        content_uri: URI to fetch content from
        content_raw: Raw text content
        payload: Document metadata

    Returns:
        Result dict with status and details
    """
    registry: SchemaRegistry = ctx["registry"]
    vectordb: QdrantAdapter = ctx["vectordb"]
    http_client: httpx.AsyncClient = ctx["http_client"]

    config = await registry.get(collection_name)

    embedder = EmbedderFactory.create(config.embedding_config.model)

    if content_raw:
        content: bytes | str = content_raw
    elif content_uri:
        response = await http_client.get(content_uri, follow_redirects=True)
        response.raise_for_status()
        content = response.content
    else:
        return {"status": "error", "doc_id": doc_id, "error": "No content provided"}

    vector = embedder.embed(content)

    vector_id = deterministic_vector_id(collection_name, doc_id)
    point = Point(
        id=vector_id,
        vector=vector,
        payload={**(payload or {}), "_doc_id": doc_id},
    )

    await vectordb.upsert(collection_name, [point])

    return {
        "status": "success",
        "doc_id": doc_id,
        "collection": collection_name,
        "vector_dim": len(vector),
    }


class WorkerSettings:
    """Arq worker configuration."""

    functions = [embed_document]
    on_startup = startup
    on_shutdown = shutdown

    # redis_settings must be a class attribute, not a method
    redis_settings = RedisSettings.from_dsn(get_settings().redis_url)

    max_jobs = 10
    job_timeout = 300
    keep_result = 3600
    poll_delay = 0.5

"""Ingestion service for document processing."""

from uuid import uuid4

import httpx
from arq import ArqRedis

from recall.models.document import IngestRequest, IngestResponse
from recall.models.errors import CollectionNotFoundError
from recall.services.registry import SchemaRegistry


class IngestionService:
    """Service for handling document ingestion."""

    def __init__(
        self,
        registry: SchemaRegistry,
        arq_redis: ArqRedis,
    ):
        self._registry = registry
        self._arq_redis = arq_redis

    async def ingest(self, collection_name: str, request: IngestRequest) -> IngestResponse:
        """Queue documents for ingestion.

        Args:
            collection_name: Target collection
            request: Ingestion request with documents

        Returns:
            Ingestion response with task ID

        Raises:
            CollectionNotFoundError: If collection doesn't exist
        """
        if not await self._registry.exists(collection_name):
            raise CollectionNotFoundError(collection_name)

        batch_id = str(uuid4())

        for doc in request.documents:
            await self._arq_redis.enqueue_job(
                "embed_document",
                collection_name=collection_name,
                doc_id=str(doc.id),
                content_uri=doc.content_uri,
                content_raw=doc.content_raw,
                payload=doc.payload,
                _job_id=f"{batch_id}:{doc.id}",
            )

        return IngestResponse(
            task_id=batch_id,
            documents_queued=len(request.documents),
            status="queued",
        )

    @staticmethod
    async def fetch_content(uri: str) -> bytes:
        """Fetch content from a URI.

        Args:
            uri: Content URI (HTTP/HTTPS)

        Returns:
            Raw content bytes
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(uri, follow_redirects=True)
            response.raise_for_status()
            return response.content

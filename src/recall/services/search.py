"""Search service for semantic queries."""

from recall.core.embedders.factory import EmbedderFactory
from recall.core.transpiler.qdrant import QdrantTranspiler
from recall.core.vectordb.base import VectorDBClient
from recall.models.search import SearchRequest, SearchResponse, SearchResult
from recall.services.registry import SchemaRegistry


class SearchService:
    """Service for handling semantic search queries."""

    def __init__(
        self,
        registry: SchemaRegistry,
        vectordb: VectorDBClient,
    ):
        self._registry = registry
        self._vectordb = vectordb

    async def search(self, collection_name: str, request: SearchRequest) -> SearchResponse:
        """Perform semantic search on a collection.

        Args:
            collection_name: Target collection
            request: Search request with query and filters

        Returns:
            Search response with results

        Raises:
            CollectionNotFoundError: If collection doesn't exist
        """
        config = await self._registry.get(collection_name)

        embedder = EmbedderFactory.create(config.embedding_config.model)

        query_vector = embedder.embed(request.query)

        qdrant_filter = QdrantTranspiler.transpile(request.filter)

        results = await self._vectordb.search(
            collection=collection_name,
            vector=query_vector,
            filter=qdrant_filter,
            limit=request.limit,
            with_payload=request.with_payload,
            with_vectors=request.with_vectors,
        )

        return SearchResponse(
            results=[
                SearchResult(
                    id=r.id,
                    score=r.score,
                    payload=r.payload,
                    vector=r.vector,
                )
                for r in results
            ],
            query=request.query,
            count=len(results),
        )

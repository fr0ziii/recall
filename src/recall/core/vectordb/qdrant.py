"""Qdrant vector database adapter."""

from typing import Any

from qdrant_client import AsyncQdrantClient, models

from recall.core.vectordb.base import Point, SearchResult, VectorDBClient
from recall.models.collection import FieldType
from recall.models.errors import VectorDBError


class QdrantAdapter(VectorDBClient):
    """Async Qdrant client adapter."""

    def __init__(self, url: str = "http://localhost:6333"):
        self._url = url
        self._client: AsyncQdrantClient | None = None

    @property
    def client(self) -> AsyncQdrantClient:
        if self._client is None:
            self._client = AsyncQdrantClient(url=self._url)
        return self._client

    async def create_collection(
        self,
        name: str,
        vector_size: int,
        schema: dict[str, str] | None = None,
    ) -> None:
        try:
            if await self.client.collection_exists(name):
                return

            await self.client.create_collection(
                collection_name=name,
                vectors_config=models.VectorParams(
                    size=vector_size,
                    distance=models.Distance.COSINE,
                ),
            )

            if schema:
                await self._create_payload_indexes(name, schema)

        except Exception as e:
            raise VectorDBError(str(e), "create_collection") from e

    async def _create_payload_indexes(self, name: str, schema: dict[str, str]) -> None:
        field_type_map = {
            FieldType.FLOAT: models.PayloadSchemaType.FLOAT,
            FieldType.INT: models.PayloadSchemaType.INTEGER,
            FieldType.KEYWORD: models.PayloadSchemaType.KEYWORD,
            FieldType.BOOL: models.PayloadSchemaType.BOOL,
            FieldType.TEXT: models.PayloadSchemaType.TEXT,
        }

        for field_name, field_type in schema.items():
            if isinstance(field_type, str):
                field_type = FieldType(field_type)
            qdrant_type = field_type_map.get(field_type)
            if qdrant_type:
                await self.client.create_payload_index(
                    collection_name=name,
                    field_name=field_name,
                    field_schema=qdrant_type,
                )

    async def delete_collection(self, name: str) -> bool:
        try:
            if not await self.client.collection_exists(name):
                return False
            await self.client.delete_collection(name)
            return True
        except Exception as e:
            raise VectorDBError(str(e), "delete_collection") from e

    async def collection_exists(self, name: str) -> bool:
        try:
            return await self.client.collection_exists(name)
        except Exception as e:
            raise VectorDBError(str(e), "collection_exists") from e

    async def upsert(self, collection: str, points: list[Point]) -> int:
        try:
            qdrant_points = [
                models.PointStruct(
                    id=p.id,
                    vector=p.vector,
                    payload=p.payload,
                )
                for p in points
            ]
            await self.client.upsert(collection_name=collection, points=qdrant_points)
            return len(points)
        except Exception as e:
            raise VectorDBError(str(e), "upsert") from e

    async def search(
        self,
        collection: str,
        vector: list[float],
        filter: Any | None = None,
        limit: int = 10,
        with_payload: bool = True,
        with_vectors: bool = False,
    ) -> list[SearchResult]:
        try:
            results = await self.client.query_points(
                collection_name=collection,
                query=vector,
                query_filter=filter,
                limit=limit,
                with_payload=with_payload,
                with_vectors=with_vectors,
            )

            return [
                SearchResult(
                    id=str(point.id),
                    score=point.score or 0.0,
                    payload=dict(point.payload) if point.payload else None,
                    vector=list(point.vector) if with_vectors and point.vector else None,
                )
                for point in results.points
            ]
        except Exception as e:
            raise VectorDBError(str(e), "search") from e

    async def close(self) -> None:
        if self._client:
            await self._client.close()
            self._client = None

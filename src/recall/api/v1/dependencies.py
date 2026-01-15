"""FastAPI dependencies for dependency injection."""

from typing import Annotated

from arq import ArqRedis
from fastapi import Depends, Request
from redis.asyncio import Redis

from recall.core.vectordb.base import VectorDBClient
from recall.services.ingestion import IngestionService
from recall.services.registry import SchemaRegistry
from recall.services.search import SearchService


async def get_redis(request: Request) -> Redis:
    """Get Redis client from app state."""
    return request.app.state.redis


async def get_arq_redis(request: Request) -> ArqRedis:
    """Get Arq Redis client from app state."""
    return request.app.state.arq_redis


async def get_vectordb(request: Request) -> VectorDBClient:
    """Get vector database client from app state."""
    return request.app.state.vectordb


async def get_registry(
    redis: Annotated[Redis, Depends(get_redis)],
) -> SchemaRegistry:
    """Get schema registry instance."""
    return SchemaRegistry(redis)


async def get_ingestion_service(
    registry: Annotated[SchemaRegistry, Depends(get_registry)],
    arq_redis: Annotated[ArqRedis, Depends(get_arq_redis)],
) -> IngestionService:
    """Get ingestion service instance."""
    return IngestionService(registry, arq_redis)


async def get_search_service(
    registry: Annotated[SchemaRegistry, Depends(get_registry)],
    vectordb: Annotated[VectorDBClient, Depends(get_vectordb)],
) -> SearchService:
    """Get search service instance."""
    return SearchService(registry, vectordb)

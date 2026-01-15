"""Collection management endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from recall.api.v1.dependencies import get_registry, get_vectordb
from recall.core.embedders.factory import EmbedderFactory
from recall.core.vectordb.base import VectorDBClient
from recall.models.collection import Collection, CollectionResponse, CreateCollectionRequest
from recall.models.errors import CollectionNotFoundError, UnsupportedModelError
from recall.services.registry import SchemaRegistry

router = APIRouter(prefix="/collections")


@router.post("", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
async def create_collection(
    body: CreateCollectionRequest,
    registry: Annotated[SchemaRegistry, Depends(get_registry)],
    vectordb: Annotated[VectorDBClient, Depends(get_vectordb)],
) -> CollectionResponse:
    """Create a new collection with embedding configuration."""
    if await registry.exists(body.name):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Collection '{body.name}' already exists",
        )

    try:
        embedder = EmbedderFactory.create(body.embedding_config.model)
    except UnsupportedModelError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message,
        )

    schema_dict = {k: v.value for k, v in body.index_schema.items()}
    await vectordb.create_collection(body.name, embedder.dimensions, schema_dict)

    await registry.save(body)

    return CollectionResponse(
        status="created",
        name=body.name,
        message=f"Collection created with {embedder.dimensions}-dim vectors",
    )


@router.get("", response_model=list[str])
async def list_collections(
    registry: Annotated[SchemaRegistry, Depends(get_registry)],
) -> list[str]:
    """List all collection names."""
    return await registry.list_all()


@router.get("/{name}", response_model=Collection)
async def get_collection(
    name: str,
    registry: Annotated[SchemaRegistry, Depends(get_registry)],
) -> Collection:
    """Get collection configuration by name."""
    try:
        return await registry.get(name)
    except CollectionNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message,
        )


@router.delete("/{name}", response_model=CollectionResponse)
async def delete_collection(
    name: str,
    registry: Annotated[SchemaRegistry, Depends(get_registry)],
    vectordb: Annotated[VectorDBClient, Depends(get_vectordb)],
) -> CollectionResponse:
    """Delete a collection and its data."""
    if not await registry.exists(name):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Collection '{name}' not found",
        )

    await vectordb.delete_collection(name)
    await registry.delete(name)

    return CollectionResponse(
        status="deleted",
        name=name,
        message="Collection and all data deleted",
    )


@router.get("/models/supported", response_model=list[str])
async def list_supported_models() -> list[str]:
    """List all supported embedding models."""
    return EmbedderFactory.supported_models()

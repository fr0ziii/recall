"""Document ingestion and browsing endpoints."""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from recall.api.v1.dependencies import get_ingestion_service, get_registry, get_vectordb
from recall.core.vectordb.base import VectorDBClient
from recall.models.document import IngestRequest, IngestResponse
from recall.models.errors import CollectionNotFoundError, SchemaValidationError
from recall.services.ingestion import IngestionService
from recall.services.registry import SchemaRegistry

router = APIRouter(prefix="/collections/{collection_name}/documents")


class DocumentPoint(BaseModel):
    """A single document point from the vector database."""

    id: str = Field(..., description="Unique point identifier")
    payload: dict[str, Any] | None = Field(None, description="Document payload/metadata")


class DocumentListResponse(BaseModel):
    """Response for document listing endpoint."""

    documents: list[DocumentPoint] = Field(default_factory=list, description="List of documents")
    total: int = Field(..., description="Total documents in collection")
    limit: int = Field(..., description="Requested limit")
    offset: int = Field(..., description="Requested offset")


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    collection_name: str,
    registry: Annotated[SchemaRegistry, Depends(get_registry)],
    vectordb: Annotated[VectorDBClient, Depends(get_vectordb)],
    limit: int = Query(default=20, ge=1, le=100, description="Maximum documents to return"),
    offset: int = Query(default=0, ge=0, description="Starting position for pagination"),
) -> DocumentListResponse:
    """List embedded documents in a collection with pagination.

    Returns documents stored in the vector database along with their payloads.
    Use offset and limit for pagination through large collections.
    """
    if not await registry.exists(collection_name):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Collection '{collection_name}' not found",
        )

    # Get total count and documents in parallel would be ideal,
    # but for simplicity we do sequential calls
    total = await vectordb.count(collection_name)
    results = await vectordb.scroll(
        collection=collection_name,
        limit=limit,
        offset=offset,
        with_payload=True,
        with_vectors=False,
    )

    documents = [
        DocumentPoint(id=r.id, payload=r.payload)
        for r in results
    ]

    return DocumentListResponse(
        documents=documents,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("", response_model=IngestResponse, status_code=status.HTTP_202_ACCEPTED)
async def ingest_documents(
    collection_name: str,
    body: IngestRequest,
    service: Annotated[IngestionService, Depends(get_ingestion_service)],
) -> IngestResponse:
    """Queue documents for async ingestion.

    Documents will be processed by background workers:
    1. Content fetched from URI (if provided)
    2. Embedding generated using collection's configured model
    3. Vector + payload stored in vector database
    """
    try:
        return await service.ingest(collection_name, body)
    except CollectionNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message,
        )
    except SchemaValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message,
        )


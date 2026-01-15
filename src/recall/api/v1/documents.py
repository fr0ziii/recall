"""Document ingestion endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from recall.api.v1.dependencies import get_ingestion_service
from recall.models.document import IngestRequest, IngestResponse
from recall.models.errors import CollectionNotFoundError
from recall.services.ingestion import IngestionService

router = APIRouter(prefix="/collections/{collection_name}/documents")


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

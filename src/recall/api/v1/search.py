"""Search endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from recall.api.v1.dependencies import get_search_service
from recall.models.errors import CollectionNotFoundError, EmbeddingError
from recall.models.search import SearchRequest, SearchResponse
from recall.services.search import SearchService

router = APIRouter(prefix="/collections/{collection_name}/search")


@router.post("", response_model=SearchResponse)
async def search(
    collection_name: str,
    body: SearchRequest,
    service: Annotated[SearchService, Depends(get_search_service)],
) -> SearchResponse:
    """Perform semantic search on a collection.

    The query is embedded using the collection's configured model,
    then similar vectors are retrieved with optional filtering.
    """
    try:
        return await service.search(collection_name, body)
    except CollectionNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message,
        )
    except EmbeddingError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message,
        )

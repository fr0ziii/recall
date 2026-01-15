"""API v1 endpoints."""

from fastapi import APIRouter

from recall.api.v1 import collections, documents, search

router = APIRouter(prefix="/v1")
router.include_router(collections.router, tags=["collections"])
router.include_router(documents.router, tags=["documents"])
router.include_router(search.router, tags=["search"])

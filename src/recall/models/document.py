"""Document models for ingestion."""

from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class Document(BaseModel):
    id: str | UUID = Field(..., description="Unique document identifier")
    content_uri: str | None = Field(None, description="URI to content (S3, HTTP, etc.)")
    content_raw: str | None = Field(None, description="Raw text content")
    payload: dict[str, Any] = Field(default_factory=dict, description="Arbitrary metadata")

    def get_content_source(self) -> str | None:
        return self.content_raw or self.content_uri


class IngestRequest(BaseModel):
    documents: list[Document] = Field(..., min_length=1, max_length=100)


class IngestResponse(BaseModel):
    task_id: str
    documents_queued: int
    status: str = "queued"

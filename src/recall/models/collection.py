"""Collection models for schema-on-write configuration."""

from enum import Enum
from typing import Annotated, Literal

from pydantic import BaseModel, Field


class Modality(str, Enum):
    TEXT = "text"
    IMAGE = "image"


class FieldType(str, Enum):
    FLOAT = "float"
    INT = "int"
    KEYWORD = "keyword"
    BOOL = "bool"
    TEXT = "text"


class EmbeddingConfig(BaseModel):
    model: str = Field(..., description="Name of the embedding model")
    modality: Modality = Field(..., description="Input modality (text/image)")


IndexSchema = dict[str, Annotated[FieldType, Field(description="Field type for indexing")]]


class Collection(BaseModel):
    name: str = Field(..., min_length=1, max_length=128, pattern=r"^[a-z0-9_-]+$")
    embedding_config: EmbeddingConfig
    index_schema: IndexSchema = Field(default_factory=dict)
    created_at: str | None = None


class CreateCollectionRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=128, pattern=r"^[a-z0-9_-]+$")
    embedding_config: EmbeddingConfig
    index_schema: IndexSchema = Field(default_factory=dict)


class CollectionResponse(BaseModel):
    status: Literal["created", "exists", "deleted"]
    name: str
    message: str | None = None

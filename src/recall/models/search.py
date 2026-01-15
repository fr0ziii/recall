"""Search request and response models."""

from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field


class EqCondition(BaseModel):
    op: Literal["EQ"] = "EQ"
    field: str
    value: str | int | float | bool


class NeqCondition(BaseModel):
    op: Literal["NEQ"] = "NEQ"
    field: str
    value: str | int | float | bool


class LtCondition(BaseModel):
    op: Literal["LT"] = "LT"
    field: str
    value: int | float


class LteCondition(BaseModel):
    op: Literal["LTE"] = "LTE"
    field: str
    value: int | float


class GtCondition(BaseModel):
    op: Literal["GT"] = "GT"
    field: str
    value: int | float


class GteCondition(BaseModel):
    op: Literal["GTE"] = "GTE"
    field: str
    value: int | float


class InCondition(BaseModel):
    op: Literal["IN"] = "IN"
    field: str
    value: list[str | int | float]


class AndFilter(BaseModel):
    op: Literal["AND"] = "AND"
    conditions: list["FilterCondition"]


class OrFilter(BaseModel):
    op: Literal["OR"] = "OR"
    conditions: list["FilterCondition"]


FilterCondition = Annotated[
    EqCondition
    | NeqCondition
    | LtCondition
    | LteCondition
    | GtCondition
    | GteCondition
    | InCondition
    | AndFilter
    | OrFilter,
    Field(discriminator="op"),
]

AndFilter.model_rebuild()
OrFilter.model_rebuild()


class SearchRequest(BaseModel):
    query: str = Field(..., description="Search query (text or image URI)")
    filter: FilterCondition | None = Field(None, description="Optional filter DSL")
    limit: int = Field(10, ge=1, le=100)
    with_payload: bool = True
    with_vectors: bool = False


class SearchResult(BaseModel):
    id: str
    score: float
    payload: dict[str, Any] | None = None
    vector: list[float] | None = None


class SearchResponse(BaseModel):
    results: list[SearchResult]
    query: str
    count: int

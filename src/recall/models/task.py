"""Task status models for async job tracking."""

from typing import Any, Literal

from pydantic import BaseModel, Field


class JobStatus(BaseModel):
    """Status of a single document processing job."""

    doc_id: str = Field(..., description="Original document identifier")
    status: Literal["queued", "in_progress", "complete", "failed", "not_found"] = Field(
        ..., description="Current job status"
    )
    result: dict[str, Any] | None = Field(None, description="Job result on success")
    error: str | None = Field(None, description="Error message on failure")


class TaskSummary(BaseModel):
    """Summary statistics for a batch task."""

    total: int = Field(..., description="Total jobs in batch")
    queued: int = Field(0, description="Jobs waiting to be processed")
    in_progress: int = Field(0, description="Jobs currently processing")
    complete: int = Field(0, description="Successfully completed jobs")
    failed: int = Field(0, description="Failed jobs")


class TaskStatusResponse(BaseModel):
    """Response for task status polling."""

    task_id: str = Field(..., description="Batch task identifier")
    jobs: list[JobStatus] = Field(default_factory=list, description="Individual job statuses")
    summary: TaskSummary = Field(..., description="Aggregated status counts")

"""Task status endpoints for async job tracking."""

from typing import Annotated

from arq import ArqRedis
from arq.jobs import Job
from arq.jobs import JobStatus as ArqJobStatus
from fastapi import APIRouter, Depends

from recall.api.v1.dependencies import get_arq_redis
from recall.models.task import JobStatus, TaskStatusResponse, TaskSummary

router = APIRouter(prefix="/tasks", tags=["tasks"])

ARQ_STATUS_MAP = {
    ArqJobStatus.queued: "queued",
    ArqJobStatus.in_progress: "in_progress",
    ArqJobStatus.complete: "complete",
    ArqJobStatus.not_found: "not_found",
}


@router.get("/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(
    task_id: str,
    arq_redis: Annotated[ArqRedis, Depends(get_arq_redis)],
) -> TaskStatusResponse:
    """Poll the status of a batch ingestion task.

    The task_id is the batch identifier returned from POST /documents.
    Each document in the batch has a job_id of format: {task_id}:{doc_id}
    """
    pattern = f"{task_id}:*"
    all_keys: list[bytes] = await arq_redis.keys(f"arq:job:{pattern}")

    jobs: list[JobStatus] = []
    summary_counts = {"queued": 0, "in_progress": 0, "complete": 0, "failed": 0}

    for key in all_keys:
        key_str = key.decode() if isinstance(key, bytes) else key
        job_id = key_str.replace("arq:job:", "")
        doc_id = job_id.split(":", 1)[1] if ":" in job_id else job_id

        job = Job(job_id, arq_redis)
        
        # Use job.status() method instead of info.status attribute
        status = await job.status()
        status_str = ARQ_STATUS_MAP.get(status, "queued")

        if status == ArqJobStatus.complete:
            # Use result_info() to get result details
            result_info = await job.result_info()
            if result_info and result_info.success:
                summary_counts["complete"] += 1
                jobs.append(JobStatus(
                    doc_id=doc_id,
                    status="complete",
                    result=result_info.result if isinstance(result_info.result, dict) else None,
                ))
            else:
                summary_counts["failed"] += 1
                error_msg = "Unknown error"
                if result_info and result_info.result:
                    error_msg = str(result_info.result)
                jobs.append(JobStatus(
                    doc_id=doc_id,
                    status="failed",
                    error=error_msg,
                ))
        elif status == ArqJobStatus.not_found:
            jobs.append(JobStatus(doc_id=doc_id, status="not_found"))
        else:
            summary_counts[status_str] = summary_counts.get(status_str, 0) + 1
            jobs.append(JobStatus(doc_id=doc_id, status=status_str))

    return TaskStatusResponse(
        task_id=task_id,
        jobs=jobs,
        summary=TaskSummary(
            total=len(jobs),
            queued=summary_counts["queued"],
            in_progress=summary_counts["in_progress"],
            complete=summary_counts["complete"],
            failed=summary_counts["failed"],
        ),
    )

"""Tests for task status models."""

from recall.models.task import JobStatus, TaskStatusResponse, TaskSummary


class TestJobStatus:
    """Tests for JobStatus model."""

    def test_queued_status(self) -> None:
        job = JobStatus(doc_id="doc-1", status="queued")
        assert job.doc_id == "doc-1"
        assert job.status == "queued"
        assert job.result is None
        assert job.error is None

    def test_complete_status_with_result(self) -> None:
        job = JobStatus(
            doc_id="doc-1",
            status="complete",
            result={"vector_dim": 384},
        )
        assert job.status == "complete"
        assert job.result == {"vector_dim": 384}

    def test_failed_status_with_error(self) -> None:
        job = JobStatus(
            doc_id="doc-1",
            status="failed",
            error="Connection timeout",
        )
        assert job.status == "failed"
        assert job.error == "Connection timeout"


class TestTaskSummary:
    """Tests for TaskSummary model."""

    def test_default_values(self) -> None:
        summary = TaskSummary(total=10)
        assert summary.total == 10
        assert summary.queued == 0
        assert summary.in_progress == 0
        assert summary.complete == 0
        assert summary.failed == 0

    def test_full_summary(self) -> None:
        summary = TaskSummary(
            total=10,
            queued=2,
            in_progress=1,
            complete=6,
            failed=1,
        )
        assert summary.total == 10
        assert summary.queued == 2
        assert summary.in_progress == 1
        assert summary.complete == 6
        assert summary.failed == 1


class TestTaskStatusResponse:
    """Tests for TaskStatusResponse model."""

    def test_empty_response(self) -> None:
        response = TaskStatusResponse(
            task_id="batch-123",
            jobs=[],
            summary=TaskSummary(total=0),
        )
        assert response.task_id == "batch-123"
        assert response.jobs == []
        assert response.summary.total == 0

    def test_response_with_jobs(self) -> None:
        response = TaskStatusResponse(
            task_id="batch-123",
            jobs=[
                JobStatus(doc_id="doc-1", status="complete"),
                JobStatus(doc_id="doc-2", status="queued"),
            ],
            summary=TaskSummary(total=2, complete=1, queued=1),
        )
        assert len(response.jobs) == 2
        assert response.summary.complete == 1

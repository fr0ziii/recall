"""Unit test fixtures."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

import fakeredis.aioredis


@pytest.fixture
async def fake_redis():
    """Create a fake Redis client for testing."""
    redis = fakeredis.aioredis.FakeRedis(decode_responses=False)
    yield redis
    await redis.aclose()


@pytest.fixture
def mock_arq_redis():
    """Create a mock Arq Redis client."""
    arq = AsyncMock()
    arq.enqueue_job = AsyncMock(return_value=MagicMock(job_id="test-job-id"))
    return arq


@pytest.fixture
def mock_sentence_transformer():
    """Mock SentenceTransformer to avoid loading actual models."""
    with patch("recall.core.embedders.text.SentenceTransformer") as mock:
        instance = MagicMock()
        instance.encode.return_value = MagicMock(tolist=lambda: [0.1] * 384)
        mock.return_value = instance
        yield mock


@pytest.fixture
def mock_clip_transformer():
    """Mock SentenceTransformer for CLIP to avoid loading actual models."""
    with patch("recall.core.embedders.clip.SentenceTransformer") as mock:
        instance = MagicMock()
        instance.encode.return_value = MagicMock(tolist=lambda: [0.1] * 512)
        mock.return_value = instance
        yield mock

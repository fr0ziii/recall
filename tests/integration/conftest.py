"""Integration test fixtures."""

from unittest.mock import AsyncMock, MagicMock

import fakeredis.aioredis
import pytest
from httpx import ASGITransport, AsyncClient


@pytest.fixture
async def fake_redis():
    """Create a fake Redis client for integration tests."""
    redis = fakeredis.aioredis.FakeRedis(decode_responses=False)
    yield redis
    await redis.aclose()


@pytest.fixture
async def mock_app(fake_redis):
    """Create a test application with mocked dependencies."""
    from recall.main import app

    mock_arq = AsyncMock()
    mock_arq.enqueue_job = AsyncMock(return_value=MagicMock(job_id="test-job"))
    mock_arq.close = AsyncMock()

    mock_vectordb = AsyncMock()
    mock_vectordb.create_collection = AsyncMock(return_value=None)
    mock_vectordb.delete_collection = AsyncMock(return_value=True)
    mock_vectordb.collection_exists = AsyncMock(return_value=True)
    mock_vectordb.search = AsyncMock(return_value=[])
    mock_vectordb.close = AsyncMock()

    app.state.redis = fake_redis
    app.state.arq_redis = mock_arq
    app.state.vectordb = mock_vectordb

    yield app

    await mock_arq.close()
    await mock_vectordb.close()


@pytest.fixture
async def client(mock_app):
    """Create an async HTTP client for testing."""
    async with AsyncClient(
        transport=ASGITransport(app=mock_app),
        base_url="http://test",
    ) as ac:
        yield ac

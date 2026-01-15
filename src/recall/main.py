"""FastAPI application entry point."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from arq import create_pool
from arq.connections import RedisSettings
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from redis.asyncio import Redis

from recall.api.v1 import router as v1_router
from recall.config import get_settings
from recall.core.vectordb.qdrant import QdrantAdapter
from recall.models.errors import RecallError


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage application lifecycle."""
    settings = get_settings()

    app.state.redis = Redis.from_url(settings.redis_url)
    app.state.arq_redis = await create_pool(RedisSettings.from_dsn(settings.redis_url))
    app.state.vectordb = QdrantAdapter(settings.qdrant_url)

    yield

    await app.state.vectordb.close()
    await app.state.arq_redis.close()
    await app.state.redis.close()


app = FastAPI(
    title="Recall",
    description="Generic Multimodal Semantic Search Engine",
    version="0.1.0",
    lifespan=lifespan,
)


@app.exception_handler(RecallError)
async def recall_error_handler(request: Request, exc: RecallError) -> JSONResponse:
    """Handle Recall-specific errors."""
    return JSONResponse(
        status_code=400,
        content={
            "error": exc.__class__.__name__,
            "message": exc.message,
            "details": exc.details,
        },
    )


app.include_router(v1_router)


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "recall.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
    )

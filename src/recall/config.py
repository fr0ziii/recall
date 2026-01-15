"""Application configuration using pydantic-settings."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    redis_url: str = "redis://localhost:6379"
    qdrant_url: str = "http://localhost:6333"

    default_text_model: str = "all-MiniLM-L6-v2"
    default_image_model: str = "clip-ViT-B-32"

    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()

"""Tests for application configuration."""

import os
from unittest.mock import patch

import pytest

from recall.config import Settings, get_settings


@pytest.mark.unit
class TestSettings:
    """Test cases for Settings configuration."""

    def test_default_values(self):
        with patch.dict(os.environ, {}, clear=True):
            settings = Settings()
            assert settings.redis_url == "redis://localhost:6379"
            assert settings.qdrant_url == "http://localhost:6333"
            assert settings.default_text_model == "all-MiniLM-L6-v2"
            assert settings.default_image_model == "clip-ViT-B-32"
            assert settings.api_host == "0.0.0.0"
            assert settings.api_port == 8000
            assert settings.debug is False

    def test_env_override_redis_url(self):
        with patch.dict(os.environ, {"REDIS_URL": "redis://custom:6380"}, clear=True):
            settings = Settings()
            assert settings.redis_url == "redis://custom:6380"

    def test_env_override_qdrant_url(self):
        with patch.dict(os.environ, {"QDRANT_URL": "http://qdrant:6333"}, clear=True):
            settings = Settings()
            assert settings.qdrant_url == "http://qdrant:6333"

    def test_env_override_debug(self):
        with patch.dict(os.environ, {"DEBUG": "true"}, clear=True):
            settings = Settings()
            assert settings.debug is True

    def test_env_override_api_port(self):
        with patch.dict(os.environ, {"API_PORT": "9000"}, clear=True):
            settings = Settings()
            assert settings.api_port == 9000


@pytest.mark.unit
class TestGetSettings:
    """Test cases for get_settings function."""

    def test_returns_settings_instance(self):
        get_settings.cache_clear()
        settings = get_settings()
        assert isinstance(settings, Settings)

    def test_caches_settings(self):
        get_settings.cache_clear()
        settings1 = get_settings()
        settings2 = get_settings()
        assert settings1 is settings2

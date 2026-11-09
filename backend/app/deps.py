"""Dependency injection providers for repositories and services."""

from functools import lru_cache
from app.config import get_settings
from app.db.base import Repository
from app.db.memory import MemoryRepository
from app.db.mongo import MongoRepository

_repo_instance: Repository | None = None


def get_repo() -> Repository:
    """Returns the configured session repository singleton."""
    global _repo_instance
    if _repo_instance is None:
        settings = get_settings()
        if settings.STORAGE_BACKEND == "mongo":
            _repo_instance = MongoRepository(settings.MONGODB_URI, settings.MONGODB_DB)
        else:
            _repo_instance = MemoryRepository()
    return _repo_instance

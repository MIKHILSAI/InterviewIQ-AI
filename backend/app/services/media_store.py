"""Local audio file storage and TTL cleanup service."""

import os
import time
from uuid import uuid4
import logging
from app.config import get_settings

logger = logging.getLogger("interviewiq.media")


def ensure_media_dir() -> str:
    settings = get_settings()
    os.makedirs(settings.MEDIA_DIR, exist_ok=True)
    return settings.MEDIA_DIR


async def save_audio(data: bytes, ext: str = "wav") -> str:
    """Saves raw audio bytes to the media storage folder and returns an absolute URL."""
    settings = get_settings()
    media_dir = ensure_media_dir()

    filename = f"{uuid4().hex}.{ext}"
    file_path = os.path.join(media_dir, filename)

    with open(file_path, "wb") as f:
        f.write(data)

    base_url = settings.PUBLIC_BASE_URL.rstrip("/")
    return f"{base_url}/media/{filename}"


async def cleanup_old(ttl_hours: int | None = None) -> int:
    """Deletes audio files older than ttl_hours (defaults to MEDIA_TTL_HOURS)."""
    settings = get_settings()
    ttl = ttl_hours if ttl_hours is not None else settings.MEDIA_TTL_HOURS
    cutoff_time = time.time() - (ttl * 3600)

    media_dir = ensure_media_dir()
    deleted_count = 0

    try:
        for entry in os.scandir(media_dir):
            if entry.is_file():
                stat = entry.stat()
                if stat.st_mtime < cutoff_time:
                    try:
                        os.remove(entry.path)
                        deleted_count += 1
                    except OSError:
                        pass
    except Exception as err:
        logger.warning("Media store cleanup error: %s", err)

    if deleted_count > 0:
        logger.info("Cleaned up %d expired audio files from %s", deleted_count, media_dir)

    return deleted_count


class MediaStore:
    """Interface for saving audio and cleaning up expired media."""

    async def save_audio(self, data: bytes, ext: str = "wav") -> str:
        return await save_audio(data, ext)

    async def cleanup_expired(self, ttl_hours: int | None = None) -> int:
        return await cleanup_old(ttl_hours)

"""Application configuration settings parsed from environment variables."""

from functools import lru_cache
from typing import Literal
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Core
    APP_ENV: str = "dev"
    PUBLIC_BASE_URL: str = "http://localhost:8000"
    CORS_ORIGINS: str = (
        "http://localhost:3000,http://127.0.0.1:3000,"
        "https://interview-iq-ai-eta.vercel.app"
    )

    # Authentication
    AUTH_DISABLED: bool = False
    CLERK_JWKS_URL: str = ""
    CLERK_ISSUER: str = ""
    CLERK_AUTHORIZED_PARTIES: str = ""

    # Storage
    STORAGE_BACKEND: Literal["memory", "mongo"] = "memory"
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB: str = "interviewiq"
    DEFAULT_TIMEZONE: str = "Asia/Kolkata"

    # Gnani STT & TTS
    GNANI_API_KEY: str = ""
    GNANI_STT_URL: str = "https://api.vachana.ai/stt/v3"
    GNANI_TTS_URL: str = "https://api.vachana.ai/api/v1/tts/inference"
    STT_MODEL: str = ""
    STT_BIAS_ENABLED: bool = True

    # TTS options
    TTS_MODEL: str = "timbre-v2.5"
    TTS_SAMPLE_RATE: int = 24000
    TTS_SPEED: float = 1.0
    VOICE_EN: str = "Kaveri"
    VOICE_TA: str = "Vedika"
    VOICE_HI: str = "Nalini"

    # LLM Settings (groq, anthropic, or openai_compat)
    LLM_PROVIDER: Literal["groq", "anthropic", "openai_compat"] = "groq"
    ANTHROPIC_API_KEY: str = ""
    LLM_MODEL_FAST: str = "claude-3-5-haiku-latest"
    LLM_MODEL_REPORT: str = "claude-3-5-sonnet-latest"

    # Groq Settings
    GROQ_API_KEY: str = ""
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"
    GROQ_MODEL: str = "openai/gpt-oss-20b"
    GROQ_MODEL_REPORT: str = "openai/gpt-oss-20b"

    # Generic OpenAI-compatible settings (Gemini, OpenRouter, etc.)
    OPENAI_COMPAT_BASE_URL: str = "https://api.groq.com/openai/v1"
    OPENAI_COMPAT_API_KEY: str = ""
    OPENAI_COMPAT_MODEL_FAST: str = "openai/gpt-oss-20b"
    OPENAI_COMPAT_MODEL_REPORT: str = "openai/gpt-oss-20b"

    # Media storage
    MEDIA_DIR: str = "./storage/audio"
    MEDIA_TTL_HOURS: int = 24
    MAX_UPLOAD_MB: int = 10
    CODING_RATE_LIMIT_PER_HOUR: int = 20
    DEEP_HEALTH: bool = False

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

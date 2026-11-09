"""LLM client factory."""

from functools import lru_cache
from app.config import get_settings
from app.services.llm.base import LLMClient
from app.services.llm.anthropic_client import AnthropicClient
from app.services.llm.openai_compat import OpenAICompatClient

_llm_instance: LLMClient | None = None


def get_llm() -> LLMClient:
    """Returns the configured LLM client singleton."""
    global _llm_instance
    if _llm_instance is None:
        settings = get_settings()
        if settings.LLM_PROVIDER == "groq":
            api_key = settings.GROQ_API_KEY or settings.OPENAI_COMPAT_API_KEY
            _llm_instance = OpenAICompatClient(
                base_url=settings.GROQ_BASE_URL,
                api_key=api_key,
            )
        elif settings.LLM_PROVIDER == "openai_compat":
            _llm_instance = OpenAICompatClient(
                base_url=settings.OPENAI_COMPAT_BASE_URL,
                api_key=settings.OPENAI_COMPAT_API_KEY,
            )
        else:
            _llm_instance = AnthropicClient(api_key=settings.ANTHROPIC_API_KEY)
    return _llm_instance

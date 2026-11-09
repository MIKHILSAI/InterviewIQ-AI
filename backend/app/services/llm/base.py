"""Protocol definition for structured JSON generation via LLMs."""

from typing import Protocol, TypeVar
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class LLMClient(Protocol):
    """Protocol for LLM providers outputting structured Pydantic models."""

    async def generate_json(
        self,
        *,
        system: str,
        user: str,
        schema: type[T],
        model: str,
        max_tokens: int = 1500,
        temperature: float = 0.3,
    ) -> T:
        """Prompts the LLM and guarantees valid instantiation of schema."""
        ...

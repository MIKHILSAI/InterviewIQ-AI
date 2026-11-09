"""Anthropic Claude LLM client using forced tool_choice for structured output."""

import logging
from typing import TypeVar
from pydantic import BaseModel, ValidationError
import anthropic

from app.errors import AppError

logger = logging.getLogger("interviewiq.llm.anthropic")
T = TypeVar("T", bound=BaseModel)


class AnthropicClient:
    """Uses official Anthropic SDK with forced tool_choice for deterministic Pydantic output."""

    def __init__(self, api_key: str):
        self.client = anthropic.AsyncAnthropic(api_key=api_key, timeout=40.0)

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
        tools = [
            {
                "name": "emit",
                "description": "Emits structured data conforming strictly to the requested schema.",
                "input_schema": schema.model_json_schema(),
            }
        ]

        attempt_user = user
        for attempt in range(2):
            try:
                response = await self.client.messages.create(
                    model=model,
                    system=system,
                    messages=[{"role": "user", "content": attempt_user}],
                    tools=tools,
                    tool_choice={"type": "tool", "name": "emit"},
                    max_tokens=max_tokens,
                    temperature=temperature,
                )

                tool_use = next((b for b in response.content if b.type == "tool_use"), None)
                if not tool_use:
                    raise AppError(502, "LLM_FAILED", "Model did not emit a tool response.")

                return schema.model_validate(tool_use.input)

            except ValidationError as val_err:
                if attempt == 0:
                    logger.warning("Anthropic schema validation failed. Retrying with error details...")
                    attempt_user = f"{user}\n\n[Previous response validation failed: {val_err}. Please correct the output structure strictly.]"
                    continue
                logger.error("Anthropic structured output validation error: %s", val_err)
                raise AppError(502, "LLM_FAILED", "The interview engine received an invalid structure.") from val_err

            except anthropic.APIError as api_err:
                logger.error("Anthropic API error: %s", api_err)
                raise AppError(502, "LLM_FAILED", "The interview engine is temporarily unavailable.") from api_err

        raise AppError(502, "LLM_FAILED", "The interview engine is temporarily unavailable.")

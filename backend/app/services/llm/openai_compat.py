"""Generic OpenAI-compatible client for Groq, Gemini, OpenRouter, or OpenAI."""

import re
import json
import logging
from typing import TypeVar
from pydantic import BaseModel, ValidationError
import httpx

from app.errors import AppError

logger = logging.getLogger("interviewiq.llm.openai_compat")
T = TypeVar("T", bound=BaseModel)


class OpenAICompatClient:
    """Uses standard /chat/completions with response_format json_object."""

    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.client = httpx.AsyncClient(timeout=40.0)

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
        schema_json = json.dumps(schema.model_json_schema(), indent=2)
        system_with_schema = (
            f"{system}\n\n"
            f"You MUST format your entire response as a valid JSON object matching this JSON schema:\n"
            f"```json\n{schema_json}\n```\n"
            f"Return pure JSON only. Do not wrap in markdown code blocks."
        )

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        attempt_user = user
        for attempt in range(2):
            try:
                payload = {
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_with_schema},
                        {"role": "user", "content": attempt_user},
                    ],
                    "response_format": {"type": "json_object"},
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                }

                resp = await self.client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                )

                if resp.status_code != 200:
                    logger.error("OpenAI-compat API error [%d]: %s", resp.status_code, resp.text[:200])
                    raise AppError(502, "LLM_FAILED", "The interview engine is temporarily unavailable.")

                body = resp.json()
                content = body["choices"][0]["message"]["content"].strip()

                # Clean markdown fencing if output was wrapped
                if content.startswith("```"):
                    content = re.sub(r"^```(?:json)?\s*", "", content, flags=re.IGNORECASE)
                    content = re.sub(r"\s*```$", "", content)

                # Attempt direct parse, or fallback to outermost JSON object extraction
                try:
                    parsed_json = json.loads(content)
                except json.JSONDecodeError:
                    match = re.search(r"\{[\s\S]*\}", content)
                    if match:
                        parsed_json = json.loads(match.group(0))
                    else:
                        raise

                return schema.model_validate(parsed_json)

            except (ValidationError, json.JSONDecodeError) as parse_err:
                if attempt == 0:
                    logger.warning("JSON parse/validate failed. Retrying: %s", parse_err)
                    attempt_user = f"{user}\n\n[Previous JSON was invalid: {parse_err}. Return valid JSON conforming to the schema.]"
                    continue
                logger.error("Failed to parse LLM JSON: %s", parse_err)
                raise AppError(502, "LLM_FAILED", "The interview engine received an invalid structure.") from parse_err

            except httpx.HTTPError as http_err:
                logger.error("OpenAI-compat HTTP error: %s", http_err)
                raise AppError(502, "LLM_FAILED", "The interview engine connection timed out.") from http_err

        raise AppError(502, "LLM_FAILED", "The interview engine is temporarily unavailable.")

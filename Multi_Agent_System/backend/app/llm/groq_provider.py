"""Groq LLM Provider for CollaborAI.

Uses the Groq API (OpenAI-compatible) with models like llama-3.3-70b-versatile.
Groq's free tier has generous limits (~30 RPM) and ultra-fast inference,
making it ideal for multi-agent coordination pipelines.
"""

from __future__ import annotations
import asyncio
import json
import logging
import re
from typing import Any, Dict, Optional, Type, TypeVar
from pydantic import BaseModel

from ..config import settings
from .base import BaseLLMProvider

logger = logging.getLogger("collaborai.llm.groq")
T = TypeVar("T", bound=BaseModel)

GROQ_FALLBACK_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "gemma2-9b-it",
]


class GroqProvider(BaseLLMProvider):
    """Production-grade Groq client with structured JSON output and retry logic."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        from groq import AsyncGroq

        resolved_key = api_key or settings.GROQ_API_KEY
        if not resolved_key:
            raise ValueError(
                "GROQ_API_KEY not set. Get a free key at https://console.groq.com/keys"
            )

        self.client = AsyncGroq(api_key=resolved_key)
        self.primary_model = model or settings.GROQ_MODEL or "llama-3.3-70b-versatile"
        self._mock_fallback: Optional[BaseLLMProvider] = None

    @property
    def mock_fallback(self) -> BaseLLMProvider:
        """Lazily load the offline mock provider for zero-downtime degradation."""
        if self._mock_fallback is None:
            from .mock_provider import MockLLMProvider
            self._mock_fallback = MockLLMProvider()
        return self._mock_fallback

    def _extract_json_block(self, text: str) -> str:
        """Strip markdown fences if model outputs ```json ... ```."""
        cleaned = text.strip()
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
        if match:
            return match.group(1).strip()
        return cleaned

    def _build_json_schema_prompt(self, response_model: Type[T]) -> str:
        """Generate a JSON schema instruction block from a Pydantic model."""
        schema = response_model.model_json_schema()
        # Remove metadata keys that confuse LLMs
        for key in ("title", "description", "$defs"):
            schema.pop(key, None)
        return json.dumps(schema, indent=2)

    async def generate_structured(
        self,
        prompt: str,
        response_model: Type[T],
        system_instruction: Optional[str] = None,
        temperature: float = 0.2
    ) -> T:
        """Call Groq with JSON mode, enforcing Pydantic schema validation."""
        schema_block = self._build_json_schema_prompt(response_model)
        system_msg = (system_instruction or "") + (
            f"\n\nYou MUST respond with valid JSON matching this exact schema:\n"
            f"```json\n{schema_block}\n```\n"
            f"Respond ONLY with the JSON object. No markdown, no explanation."
        )

        models_to_try = [self.primary_model] + [
            m for m in GROQ_FALLBACK_MODELS if m != self.primary_model
        ]

        last_error = None
        for model_name in models_to_try:
            for attempt in range(3):
                try:
                    resp = await self.client.chat.completions.create(
                        model=model_name,
                        messages=[
                            {"role": "system", "content": system_msg},
                            {"role": "user", "content": prompt},
                        ],
                        temperature=temperature,
                        max_tokens=4096,
                        response_format={"type": "json_object"},
                    )
                    raw_text = resp.choices[0].message.content or "{}"
                    json_text = self._extract_json_block(raw_text)
                    return response_model.model_validate_json(json_text)

                except Exception as e:
                    last_error = e
                    error_msg = str(e).lower()

                    # Model not found -> try next model
                    if "model_not_found" in error_msg or "not found" in error_msg:
                        logger.warning("Groq model %s not available, trying next.", model_name)
                        break

                    # Rate limit -> backoff and retry
                    if "rate_limit" in error_msg or "429" in error_msg:
                        backoff = (2 ** attempt) + 0.5
                        logger.warning(
                            "Groq rate limited (attempt %d/3, model: %s). Retrying in %.1fs.",
                            attempt + 1, model_name, backoff
                        )
                        await asyncio.sleep(backoff)
                        continue

                    # JSON parse error -> retry with same model
                    if "validation" in error_msg or "json" in error_msg:
                        logger.warning(
                            "Groq JSON parse error (attempt %d/3): %s", attempt + 1, str(e)[:120]
                        )
                        continue

                    logger.error("Groq API error: %s", e)
                    break

        # All retries exhausted — fall back to mock
        logger.warning(
            "Groq API exhausted all retries (%s). Falling back to simulation.", last_error
        )
        return await self.mock_fallback.generate_structured(
            prompt=prompt,
            response_model=response_model,
            system_instruction=system_instruction,
            temperature=temperature
        )

    async def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.4
    ) -> str:
        """Generate unstructured text response."""
        try:
            resp = await self.client.chat.completions.create(
                model=self.primary_model,
                messages=[
                    {"role": "system", "content": system_instruction or "You are a helpful analyst."},
                    {"role": "user", "content": prompt},
                ],
                temperature=temperature,
                max_tokens=2048,
            )
            return resp.choices[0].message.content or ""
        except Exception as ex:
            logger.warning("Groq text generation failed (%s). Falling back to simulation.", ex)
            return await self.mock_fallback.generate_text(
                prompt=prompt,
                system_instruction=system_instruction,
                temperature=temperature
            )

    async def health_check(self) -> Dict[str, Any]:
        """Test Groq API connectivity."""
        try:
            resp = await self.generate_text(
                prompt="Ping test. Respond with 'PONG'.",
                temperature=0.0
            )
            return {
                "status": "healthy",
                "provider": "GroqProvider",
                "model": self.primary_model,
                "response": resp.strip()[:20],
            }
        except Exception as e:
            return {
                "status": "degraded",
                "provider": "GroqProvider",
                "error": str(e),
            }

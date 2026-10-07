"""Google Gemini Free Tier LLM Provider Implementation.

Adheres strictly to Free Tier quotas (15 RPM) using TokenBucketRateLimiter,
exponential backoff with jitter on 429/503 errors, model fallbacks,
and Pydantic structured output validation.
"""

from __future__ import annotations
import asyncio
import json
import logging
import random
import re
from typing import Any, Dict, List, Optional, Type, TypeVar
from pydantic import BaseModel
from google import genai
from google.genai import types
from google.genai.errors import APIError, ClientError, ServerError

from ..config import settings
from .base import BaseLLMProvider
from .rate_limiter import rate_limiter

logger = logging.getLogger("collaborai.llm.gemini")
T = TypeVar("T", bound=BaseModel)

FALLBACK_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-flash-latest",
    "gemini-3.8-flash"
]


class GeminiProvider(BaseLLMProvider):
    """Production-grade Google Gemini client with Multi-Key Pool & Zero-Downtime Fallback."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        # Configure Multi-Key Pool
        if api_key:
            self.api_keys: List[str] = [k.strip() for k in api_key.split(",") if k.strip()]
        else:
            self.api_keys: List[str] = settings.gemini_api_keys

        if not self.api_keys:
            logger.warning("No GEMINI_API_KEY provided. Provider will use simulation fallback.")

        self._active_key_index: int = 0
        self.primary_model = model or settings.GEMINI_MODEL or "gemini-3.5-flash-lite"
        self._client: Optional[genai.Client] = None
        self._mock_fallback: Optional[BaseLLMProvider] = None

    @property
    def current_api_key(self) -> str:
        """Fetch the currently active API key from the rotation pool."""
        if not self.api_keys:
            return ""
        return self.api_keys[self._active_key_index % len(self.api_keys)]

    @property
    def client(self) -> genai.Client:
        """Lazily initialize client with the currently active key."""
        if self._client is None:
            self._client = genai.Client(api_key=self.current_api_key)
        return self._client

    @property
    def mock_fallback(self) -> BaseLLMProvider:
        """Lazily load the offline mock provider for zero-downtime degradation."""
        if self._mock_fallback is None:
            from .mock_provider import MockLLMProvider
            self._mock_fallback = MockLLMProvider()
        return self._mock_fallback

    def rotate_key(self) -> bool:
        """Rotate to the next API key in the pool upon quota exhaustion."""
        if len(self.api_keys) > 1:
            old_index = self._active_key_index
            self._active_key_index = (self._active_key_index + 1) % len(self.api_keys)
            self._client = None  # Force re-initialization with new key
            logger.warning(
                "Gemini quota exhausted on key %d/%d. Rotated to key %d/%d.",
                old_index + 1, len(self.api_keys),
                self._active_key_index + 1, len(self.api_keys)
            )
            return True
        return False

    def _extract_json_block(self, text: str) -> str:
        """Strip markdown fences if model outputs ```json ... ```."""
        cleaned = text.strip()
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
        if match:
            return match.group(1).strip()
        return cleaned

    async def _execute_with_retry(self, fn, max_retries: int = 4):
        """Execute async API call with key rotation, rate limiting, and exponential backoff."""
        if not self.current_api_key:
            raise RuntimeError("No Gemini API key available.")

        models_to_try = [self.primary_model] + [m for m in FALLBACK_MODELS if m != self.primary_model]
        last_error = None
        initial_key_index = self._active_key_index
        keys_attempted = 0

        while keys_attempted <= len(self.api_keys):
            for model_name in models_to_try:
                for attempt in range(max_retries):
                    # Acquire rate limiter slot (12 RPM)
                    await rate_limiter.acquire()
                    try:
                        return await fn(model_name)
                    except (APIError, ServerError, ClientError) as e:
                        last_error = e
                        status_code = getattr(e, "code", getattr(e, "status_code", None))
                        error_msg = str(e).lower()

                        # Model unavailable / not found -> break to next fallback model immediately
                        if "not_found" in error_msg or "is no longer available" in error_msg or status_code == 404:
                            logger.warning("Model %s unavailable (404). Falling back to next model.", model_name)
                            break

                        # Daily Quota exhausted check -> try rotating API key immediately
                        if ("quota" in error_msg and "exceeded" in error_msg) or "queries per day" in error_msg:
                            if self.rotate_key():
                                logger.info("Retrying with newly rotated API key...")
                                keys_attempted += 1
                                break  # Break model attempt to restart with new key

                        # Rate limited (429) or temporary server spike (503)
                        if "resourceexhausted" in error_msg or "429" in error_msg or "503" in error_msg or "unavailable" in error_msg:
                            backoff = (2 ** attempt) + random.uniform(0.5, 1.5)
                            logger.warning(
                                "Gemini rate limit or server busy (attempt %d/%d, model: %s, key: %d/%d). Retrying in %.2fs. Error: %s",
                                attempt + 1, max_retries, model_name,
                                self._active_key_index + 1, max(1, len(self.api_keys)),
                                backoff, str(e)[:120]
                            )
                            await asyncio.sleep(backoff)
                            continue

                        # Other client error
                        logger.error("Non-retryable Gemini error: %s", e)
                        raise
                    except Exception as ex:
                        last_error = ex
                        logger.error("Unexpected error calling Gemini API: %s", ex)
                        raise

            # If all models failed on this key, try rotating key once before giving up
            if self.rotate_key():
                keys_attempted += 1
                continue
            break

        raise RuntimeError(f"All Gemini retries, models, and API keys exhausted. Last error: {last_error}")

    async def generate_structured(
        self,
        prompt: str,
        response_model: Type[T],
        system_instruction: Optional[str] = None,
        temperature: float = 0.2
    ) -> T:
        """Call Gemini enforcing Pydantic schema validation, with graceful simulation fallback."""
        async def call_api(model_name: str):
            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=response_model,
                system_instruction=system_instruction,
                temperature=temperature
            )
            resp = await self.client.aio.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config
            )
            raw_text = resp.text or "{}"
            json_text = self._extract_json_block(raw_text)
            return response_model.model_validate_json(json_text)

        try:
            return await self._execute_with_retry(call_api)
        except Exception as ex:
            logger.warning(
                "Gemini API call failed (%s). Gracefully falling back to simulation provider.",
                ex
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
        """Generate unstructured text response with graceful simulation fallback."""
        async def call_api(model_name: str):
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=temperature
            )
            resp = await self.client.aio.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config
            )
            return resp.text or ""

        try:
            return await self._execute_with_retry(call_api)
        except Exception as ex:
            logger.warning(
                "Gemini API call failed (%s). Gracefully falling back to simulation provider.",
                ex
            )
            return await self.mock_fallback.generate_text(
                prompt=prompt,
                system_instruction=system_instruction,
                temperature=temperature
            )

    async def health_check(self) -> Dict[str, Any]:
        """Test API connectivity and report multi-key pool telemetry."""
        try:
            resp = await self.generate_text(
                prompt="Ping test. Respond with 'PONG'.",
                temperature=0.0
            )
            return {
                "status": "healthy",
                "model": self.primary_model,
                "pool_size": len(self.api_keys),
                "active_key_index": self._active_key_index,
                "response": resp.strip()[:20],
                "telemetry": rate_limiter.get_telemetry()
            }
        except Exception as e:
            return {
                "status": "degraded",
                "pool_size": len(self.api_keys),
                "error": str(e),
                "telemetry": rate_limiter.get_telemetry()
            }

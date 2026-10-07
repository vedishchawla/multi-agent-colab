"""CollaborAI LLM Layer.

Provides modular LLM access with multiple provider backends:
- Groq (recommended): Free tier, ultra-fast inference, ~30 RPM
- Gemini: Google AI Studio free tier with rate-limiting safeguards
- Mock: Deterministic simulation provider for offline/zero-token operation
"""

from .base import BaseLLMProvider
from .rate_limiter import rate_limiter, TokenBucketRateLimiter
from .gemini import GeminiProvider
from .groq_provider import GroqProvider
from .mock_provider import MockLLMProvider
from ..config import settings

import logging
logger = logging.getLogger("collaborai.llm")


def get_llm_provider(force_simulation: bool = False) -> BaseLLMProvider:
    """Factory providing the configured LLM client.
    
    Selection priority:
    1. force_simulation or SIMULATION_MODE -> MockLLMProvider
    2. LLM_PROVIDER="groq" + GROQ_API_KEY -> GroqProvider
    3. LLM_PROVIDER="gemini" + GEMINI_API_KEY -> GeminiProvider
    4. LLM_PROVIDER="auto" -> tries Groq first (faster), then Gemini, then Mock
    """
    if force_simulation or settings.SIMULATION_MODE:
        logger.info("Using MockLLMProvider (simulation mode)")
        return MockLLMProvider()

    provider = settings.LLM_PROVIDER.lower().strip()

    # Explicit Groq selection
    if provider == "groq":
        if settings.GROQ_API_KEY:
            logger.info("Using GroqProvider (model: %s)", settings.GROQ_MODEL)
            return GroqProvider()
        logger.warning("LLM_PROVIDER=groq but GROQ_API_KEY is empty. Falling back to simulation.")
        return MockLLMProvider()

    # Explicit Gemini selection
    if provider == "gemini":
        if settings.GEMINI_API_KEY:
            logger.info("Using GeminiProvider (model: %s)", settings.GEMINI_MODEL)
            return GeminiProvider()
        logger.warning("LLM_PROVIDER=gemini but GEMINI_API_KEY is empty. Falling back to simulation.")
        return MockLLMProvider()

    # Auto-detect: prefer Groq (faster, higher limits), then Gemini
    if settings.GROQ_API_KEY:
        logger.info("Auto-detected GROQ_API_KEY. Using GroqProvider (model: %s)", settings.GROQ_MODEL)
        return GroqProvider()

    if settings.GEMINI_API_KEY:
        logger.info("Auto-detected GEMINI_API_KEY. Using GeminiProvider (model: %s)", settings.GEMINI_MODEL)
        return GeminiProvider()

    logger.info("No API keys configured. Using MockLLMProvider (simulation mode)")
    return MockLLMProvider()


__all__ = [
    "BaseLLMProvider",
    "rate_limiter",
    "TokenBucketRateLimiter",
    "GeminiProvider",
    "GroqProvider",
    "MockLLMProvider",
    "get_llm_provider",
]

"""Abstract Base LLM Provider Interface for CollaborAI."""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, Type, TypeVar
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class BaseLLMProvider(ABC):
    """Abstract interface for LLM backends.
    
    Ensures the application is modular and not coupled to any single API.
    """

    @abstractmethod
    async def generate_structured(
        self,
        prompt: str,
        response_model: Type[T],
        system_instruction: Optional[str] = None,
        temperature: float = 0.2
    ) -> T:
        """Generate a response strictly validated against a Pydantic schema."""
        pass

    @abstractmethod
    async def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.4
    ) -> str:
        """Generate unstructured narrative text."""
        pass

    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """Verify API connectivity and report status."""
        pass

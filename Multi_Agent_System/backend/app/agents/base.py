"""Base Agent Class with Blackboard Access & Structured Output Capabilities."""

from __future__ import annotations
import logging
from typing import Any, Dict, List, Optional, Type, TypeVar
from pydantic import BaseModel

from ..llm import BaseLLMProvider, get_llm_provider
from ..schemas.state import Finding, SharedState

logger = logging.getLogger("collaborai.agents.base")
T = TypeVar("T", bound=BaseModel)


class BaseAgent:
    """Foundational agent providing blackboard inspection, prompt assembly, and LLM calls."""

    def __init__(self, agent_name: str, role_title: str, llm_provider: Optional[BaseLLMProvider] = None):
        self.agent_name = agent_name
        self.role_title = role_title
        self.llm = llm_provider or get_llm_provider()

    def format_blackboard_context(self, state: SharedState, exclude_agent: Optional[str] = None) -> str:
        """Format existing blackboard findings into structured context for peer review."""
        relevant_findings = [
            f for f in state.findings
            if f.status == "active" and (exclude_agent is None or f.agent_name != exclude_agent)
        ]

        if not relevant_findings:
            return "No previous findings posted on the blackboard yet."

        lines = ["=== ACTIVE SHARED BLACKBOARD FINDINGS ==="]
        for f in relevant_findings:
            lines.append(f"\n[Finding ID: {f.finding_id}] Posted by: {f.agent_name} ({f.topic})")
            lines.append(f"  Claim: {f.claim}")
            if f.assertions:
                assertions_str = ", ".join(
                    f"{a.dimension}={a.value}{(' ' + a.unit) if a.unit else ''} (flexible={a.is_flexible})"
                    for a in f.assertions
                )
                lines.append(f"  Assertions: {assertions_str}")
            if f.assumptions:
                lines.append(f"  Assumptions: {'; '.join(f.assumptions)}")
            lines.append(f"  Confidence: {f.confidence:.2f}")

        return "\n".join(lines)

    def format_constraints(self, state: SharedState) -> str:
        """Format active user and system constraints."""
        if not state.constraints:
            return "No explicit constraints specified."
        return "\n".join(
            f"- [{c.category.upper()}] {c.description} (Hard Constraint: {c.is_hard_constraint})"
            for c in state.constraints
        )

    async def call_structured(
        self,
        prompt: str,
        response_model: Type[T],
        system_instruction: Optional[str] = None,
        temperature: float = 0.2
    ) -> T:
        """Invoke LLM with structured output schema enforcement."""
        return await self.llm.generate_structured(
            prompt=prompt,
            response_model=response_model,
            system_instruction=system_instruction,
            temperature=temperature
        )

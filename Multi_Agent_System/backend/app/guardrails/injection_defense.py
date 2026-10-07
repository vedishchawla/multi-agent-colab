"""Adversarial Prompt Injection Defense and Input Guardrails for CollaborAI.

Provides deterministic runtime guardrails against prompt injection, jailbreaks,
system instruction overrides, and credential exfiltration attempts.
Directly addresses Experiment 1: Adversarial Testing & Guardrail Safety.
"""

from __future__ import annotations
import re
from typing import List, Optional
from pydantic import BaseModel, Field


class InjectionCheckResult(BaseModel):
    """Result of prompt injection and adversarial vulnerability screening."""
    is_safe: bool = Field(description="Whether the input is safe to pass to agents")
    threat_level: str = Field(description="'clean', 'suspicious', or 'critical'")
    flagged_patterns: List[str] = Field(default_factory=list, description="Specific matched attack patterns")
    sanitized_text: str = Field(description="Sanitized input safe for agent ingestion")
    rejection_reason: Optional[str] = Field(default=None, description="Explanation if rejected")


# Known adversarial attack signatures
CRITICAL_INJECTION_PATTERNS = [
    (r"(?i)ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|directives|prompts|rules)", "Directive Override Attempt"),
    (r"(?i)disregard\s+(all\s+)?(previous|prior|system)\s+(instructions|guidelines|rules)", "System Instruction Disregard"),
    (r"(?i)system\s+override\s*:", "Direct System Override Token"),
    (r"(?i)you\s+are\s+no\s+longer\s+(an?\s+)?(agent|analyst|specialist|ai)", "Agent Persona Hijacking"),
    (r"(?i)(act\s+as|pretend\s+you\s+are)\s+(a\s+)?(jailbreak|dan|unfiltered|unrestricted|evil)", "Jailbreak Role Subversion"),
    (r"(?i)(bypass|disable)\s+(safety|content\s+filters|guardrails|ethical\s+guidelines)", "Safety Filter Bypass Attempt"),
    (r"(?i)(reveal|show|print|leak|dump)\s+(the\s+)?(system\s+prompt|api\s+key|environment\s+variables|\.env)", "Data Exfiltration Attempt"),
    (r"(?i)stop\s+being\s+a\s+collaborative\s+system", "Collaborative Invalidation"),
    (r"<\|im_start\|>|<\|im_end\|>|\[INST\]|\[/INST\]|<<SYS>>|<</SYS>>", "ChatML / Delimiter Injection Escaping"),
]

SUSPICIOUS_PATTERNS = [
    (r"(?i)\bbase64\b.{20,}", "Obfuscated Base64 Payload"),
    (r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "Null Byte / Control Character Injection"),
    (r"```[\s\S]*?(override|sudo|chmod|eval|rm\s+-rf)", "Code Execution / Shell Injection Marker"),
]


def validate_and_sanitize_prompt(raw_text: str) -> InjectionCheckResult:
    """Audit user input for adversarial prompt injections and jailbreak attacks.
    
    Returns an InjectionCheckResult with security posture and sanitized text.
    """
    if not raw_text or not raw_text.strip():
        return InjectionCheckResult(
            is_safe=True,
            threat_level="clean",
            flagged_patterns=[],
            sanitized_text="",
            rejection_reason=None
        )

    flagged = []
    sanitized = raw_text

    # 1. Check for Critical Injection Patterns
    for pattern, description in CRITICAL_INJECTION_PATTERNS:
        match = re.search(pattern, raw_text)
        if match:
            flagged.append(f"{description} (matched: '{match.group(0)}')")

    if flagged:
        return InjectionCheckResult(
            is_safe=False,
            threat_level="critical",
            flagged_patterns=flagged,
            sanitized_text=raw_text,
            rejection_reason=(
                f"Adversarial prompt injection detected: {'; '.join(flagged)}. "
                "Deliberation aborted by AI Safety Guardrail."
            )
        )

    # 2. Check for Suspicious / Obfuscated Patterns
    for pattern, description in SUSPICIOUS_PATTERNS:
        match = re.search(pattern, raw_text)
        if match:
            flagged.append(description)
            # Neutralize control characters
            sanitized = re.sub(pattern, "[SANITIZED]", sanitized)

    threat = "suspicious" if flagged else "clean"
    return InjectionCheckResult(
        is_safe=True,
        threat_level=threat,
        flagged_patterns=flagged,
        sanitized_text=sanitized.strip(),
        rejection_reason=None
    )

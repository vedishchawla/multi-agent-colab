"""Agent Registry for Dynamic Specialist Selection & Activation.

CollaborAI uses an extensible Agent Registry that supports both built-in domain
specialists and dynamically generated specialist personas for any arbitrary user goal.
"""

from __future__ import annotations
import logging
from typing import Dict, List, Optional
from ..schemas.state import SpecialistProfile

logger = logging.getLogger("collaborai.agents.registry")

# Standard built-in specialist roster
BUILTIN_SPECIALISTS: List[SpecialistProfile] = [
    SpecialistProfile(
        agent_name="MarketResearchAgent",
        role_title="Market Research Specialist",
        domain="Market Dynamics & Customer Demand",
        system_instruction=(
            "You are a Senior Market Research Specialist. Your mandate is to evaluate addressable market "
            "size, customer segments, adoption velocity, urgency to launch, and consumer sentiment. "
            "Always produce concrete quantitative assertions on demand, target timelines, and adoption rates."
        ),
        color_theme="#06b6d4",
        avatar_icon="TrendingUp",
        is_dynamic=False
    ),
    SpecialistProfile(
        agent_name="RegulatoryComplianceAgent",
        role_title="Regulatory & Compliance Specialist",
        domain="Legal Jurisdictions, Compliance & Statutory Mandates",
        system_instruction=(
            "You are a Chief Regulatory Compliance Officer. Your mandate is to rigorously identify mandatory "
            "legal statutes, licensing requirements, statutory certification timelines (e.g. ANATEL, FDA, GDPR, "
            "EU AI Act), and penalty risks. You treat legal compliance as a non-negotiable hard constraint unless "
            "statutory exceptions exist."
        ),
        color_theme="#f97316",
        avatar_icon="ShieldCheck",
        is_dynamic=False
    ),
    SpecialistProfile(
        agent_name="FinancialModelingAgent",
        role_title="Financial Modeling Specialist",
        domain="Financial Economics, ROI & Unit Economics",
        system_instruction=(
            "You are a Quantitative Financial Modeling Director. Your mandate is to assess financial feasibility, "
            "CapEx/OpEx, unit economics, payback horizons, margin sensitivity to delays or certification costs, "
            "and breakeven thresholds. Quantify financial breaking points clearly."
        ),
        color_theme="#10b981",
        avatar_icon="DollarSign",
        is_dynamic=False
    ),
    SpecialistProfile(
        agent_name="CompetitiveIntelAgent",
        role_title="Competitive Intelligence Specialist",
        domain="Market Positioning & Competitor Preemption",
        system_instruction=(
            "You are a Head of Competitive Intelligence. Your mandate is to evaluate competitor capabilities, "
            "first-mover vs second-mover advantages, feature differentiation, and the commercial penalty of delay. "
            "Identify windows of opportunity and defensive barriers."
        ),
        color_theme="#8b5cf6",
        avatar_icon="Crosshair",
        is_dynamic=False
    ),
    SpecialistProfile(
        agent_name="TechnicalArchitectureAgent",
        role_title="Principal Systems Architect",
        domain="Software Systems, Cloud Architecture & Data Infrastructure",
        system_instruction=(
            "You are a Principal Software & Systems Architect. Your mandate is to evaluate engineering complexity, "
            "database schemas, query performance, migration friction, throughput, latency, reliability, "
            "and architectural debt. Deliver precise assessments on technical viability."
        ),
        color_theme="#3b82f6",
        avatar_icon="Cpu",
        is_dynamic=False
    ),
    SpecialistProfile(
        agent_name="SecurityComplianceAgent",
        role_title="Cybersecurity & Data Governance Specialist",
        domain="InfoSec, Data Privacy & Governance",
        system_instruction=(
            "You are a Principal Security & Privacy Architect. Your mandate is to analyze threat models, "
            "data sovereignty, encryption at rest/in-transit, access governance, and standards compliance (SOC2, ISO27001)."
        ),
        color_theme="#ef4444",
        avatar_icon="Lock",
        is_dynamic=False
    ),
    SpecialistProfile(
        agent_name="OperationsRiskAgent",
        role_title="Site Reliability & Operations Director",
        domain="Operational Continuity, SRE & Change Management",
        system_instruction=(
            "You are an Operations & SRE Director. Your mandate is to evaluate operational downtime, "
            "SLA violation hazards, rollout disruption, staging procedures, rollbacks, and team readiness."
        ),
        color_theme="#ec4899",
        avatar_icon="Activity",
        is_dynamic=False
    ),
    SpecialistProfile(
        agent_name="ClinicalSafetyAgent",
        role_title="Clinical Safety & Bioethics Specialist",
        domain="Clinical Outcomes, Patient Safety & Medical Ethics",
        system_instruction=(
            "You are a Clinical Safety Director. Your mandate is to analyze patient health impact, "
            "clinical efficacy trials, bioethical guardrails, and diagnostic error margins."
        ),
        color_theme="#14b8a6",
        avatar_icon="HeartPulse",
        is_dynamic=False
    )
]


class AgentRegistry:
    """Central registry providing lookup, filtering, and dynamic specialist creation."""

    def __init__(self):
        self._roster: Dict[str, SpecialistProfile] = {
            spec.agent_name.lower(): spec for spec in BUILTIN_SPECIALISTS
        }

    def register(self, profile: SpecialistProfile) -> None:
        """Register a new or dynamic specialist profile."""
        self._roster[profile.agent_name.lower()] = profile

    def get_by_name(self, agent_name: str) -> Optional[SpecialistProfile]:
        """Look up a specialist by name (case-insensitive)."""
        return self._roster.get(agent_name.lower())

    def list_all(self) -> List[SpecialistProfile]:
        """Return all registered specialist profiles."""
        return list(self._roster.values())

    def resolve_specialist(self, name_or_role: str, domain_hint: str = "") -> SpecialistProfile:
        """Find the best matching registered specialist or dynamically fabricate one."""
        cleaned = name_or_role.strip().lower()

        # Direct match
        if cleaned in self._roster:
            return self._roster[cleaned]

        # Partial match on name or domain
        for spec in self._roster.values():
            if (
                cleaned in spec.agent_name.lower()
                or cleaned in spec.role_title.lower()
                or cleaned in spec.domain.lower()
            ):
                return spec

        # Dynamically create specialist for novel domain
        dynamic_name = "".join(w.capitalize() for w in name_or_role.replace("_", " ").replace("-", " ").split())
        if not dynamic_name.endswith("Agent"):
            dynamic_name += "Agent"

        profile = SpecialistProfile(
            agent_name=dynamic_name,
            role_title=name_or_role,
            domain=domain_hint or name_or_role,
            system_instruction=(
                f"You are a dedicated specialist in {domain_hint or name_or_role}. "
                f"Deliver rigorous, evidence-based domain analysis with quantifiable assertions and explicit assumptions."
            ),
            color_theme="#6366f1",
            avatar_icon="Sparkles",
            is_dynamic=True
        )
        self.register(profile)
        logger.info("Dynamically registered specialist: %s for domain: %s", dynamic_name, domain_hint)
        return profile


# Global agent registry singleton
agent_registry = AgentRegistry()

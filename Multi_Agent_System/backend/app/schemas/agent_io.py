"""Agent Input/Output Structured Schemas for Gemini Structured Generation.

These Pydantic models define the structured output contract that Gemini
produces for each specialist and coordination agent.
"""

from __future__ import annotations
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field
from .state import Assertion, Constraint, Workstream, Task, EscalationOption, SpecialistProfile


class GoalDecompositionOutput(BaseModel):
    """Structured output returned by the Goal Decomposition Agent."""
    problem_statement_clarified: str = Field(description="Crisp reframing of the user's primary decision problem")
    decomposed_workstreams: List[Workstream] = Field(description="2-4 interdependent specialist workstreams")
    activated_specialists: List[SpecialistProfile] = Field(
        description="List of specialist agents activated for this specific goal"
    )
    extracted_implicit_constraints: List[Constraint] = Field(
        default_factory=list,
        description="Implicit constraints extracted from the goal context"
    )


class SpecialistFindingOutput(BaseModel):
    """Structured output returned by an individual Specialist Agent."""
    topic: str = Field(description="Specific analytical topic evaluated")
    claim: str = Field(description="Core substantive finding, evaluation, or decision stance")
    assertions: List[Assertion] = Field(
        default_factory=list,
        description="Quantifiable assertions (timeline, budget, compliance, risk, performance)"
    )
    assumptions: List[str] = Field(
        default_factory=list,
        description="Specific underlying assumptions made by this specialist"
    )
    confidence: float = Field(ge=0.0, le=1.0, default=0.85, description="Confidence score")
    evidence_summary: str = Field(description="Detailed rationale and supporting domain logic")
    dependencies_on_peers: List[str] = Field(
        default_factory=list,
        description="Notes on peer findings this analysis relies upon"
    )


class DetectedConflictItem(BaseModel):
    """Single conflict detected between specialist claims."""
    agents_involved: List[str] = Field(description="Names of conflicting agents")
    conflict_type: Literal[
        "timeline_mismatch",
        "budget_exceeded",
        "regulatory_violation",
        "risk_appetite_clash",
        "architectural_incompatibility",
        "resource_contention",
        "general_contradiction"
    ]
    description: str = Field(description="Clear explanation of the tension or incompatibility")
    severity: Literal["low", "medium", "high", "critical"] = "high"
    incompatible_claims: List[str] = Field(description="Summary of the conflicting statements")


class ConflictDetectionOutput(BaseModel):
    """Structured output returned by the Conflict Detection Agent."""
    conflicts_detected: List[DetectedConflictItem] = Field(default_factory=list)
    has_conflicts: bool = Field(default=False)
    cross_agent_compatibility_score: float = Field(
        ge=0.0,
        le=1.0,
        default=0.8,
        description="Overall compatibility score across specialist outputs"
    )
    summary_of_tensions: str = Field(default="No critical tensions detected.")


class NegotiationProposalOutput(BaseModel):
    """Structured counter-proposal returned by a specialist during negotiation."""
    proposing_agent: str
    compromise_statement: str = Field(description="What trade-off or alternative this agent is offering")
    concessions_made: List[str] = Field(description="Specific ground or metrics this agent is conceding")
    impact_on_domain: str = Field(description="How this compromise alters its own domain outcomes")


class RevisedFindingItem(BaseModel):
    """Updated claim and assertions after a successful negotiation."""
    finding_id: str
    revised_claim: str
    revised_assertions: List[Assertion] = Field(default_factory=list)


class NegotiationModerationOutput(BaseModel):
    """Structured compromise resolution synthesized by the Negotiation Moderator."""
    compromise_achieved: bool = Field(description="Whether a valid consensus was formulated")
    synthesis_statement: str = Field(description="Synthesized compromise agreement across all parties")
    revised_findings: List[RevisedFindingItem] = Field(
        default_factory=list,
        description="Revisions to apply to the blackboard findings"
    )
    unresolved_issues: List[str] = Field(default_factory=list)


# Backward-compatible alias
NegotiationCompromiseOutput = NegotiationModerationOutput


class InvalidatedFindingItem(BaseModel):
    finding_id: str
    invalidating_reason: str
    impacted_agent: str


class StaleAssumptionOutput(BaseModel):
    """Structured output evaluating stale assumptions after new findings or negotiations."""
    invalidated_findings: List[InvalidatedFindingItem] = Field(
        default_factory=list,
        description="List of invalidated findings"
    )
    has_stale_assumptions: bool = False


class GoalConsistencyOutput(BaseModel):
    """Evaluation of whether current negotiated state still satisfies the primary goal."""
    is_aligned: bool = Field(description="Whether the negotiated state preserves the primary user goal")
    alignment_score: float = Field(ge=0.0, le=1.0, default=0.9)
    divergence_notes: Optional[str] = None
    consistency_verdict: str = Field(description="Summary audit verdict")


class ClaimAttributionItem(BaseModel):
    """Attribution item mapping a synthesized recommendation statement to source agents."""
    statement: str = Field(description="The recommendation claim or milestone")
    contributing_agents: List[str] = Field(description="Agents who provided the basis for this")
    rationale: str = Field(description="How source findings support this claim")
    confidence: float = Field(default=0.9)


class RoadmapPhase(BaseModel):
    phase: str
    duration: str
    actions: List[str]
    owner: str


class RiskMitigationItem(BaseModel):
    risk: str
    severity: str
    mitigation: str
    monitoring: str


class SynthesisOutput(BaseModel):
    """Structured final recommendation produced by the Synthesis Agent."""
    executive_summary: str = Field(description="Executive narrative summarizing the collective decision")
    strategic_verdict: Literal["GO", "GO_WITH_CONDITIONS", "DEFER", "NO_GO", "ALTERNATIVE_SELECTED"]
    phased_roadmap: List[RoadmapPhase] = Field(
        description="Structured chronological phases (phase, timeline, actions, owner)"
    )
    risk_mitigation_plan: List[RiskMitigationItem] = Field(
        description="Mitigation matrix (risk, severity, countermeasure, monitoring)"
    )
    attributed_claims: List[ClaimAttributionItem] = Field(
        description="Granular claim-level attributions back to specialists"
    )

"""Shared State Schema for CollaborAI Blackboard.

This module defines the central multi-agent state blackboard.
All agents communicate by reading and writing to this strongly-typed state.
It is completely general-purpose and supports arbitrary user goals.
"""

from __future__ import annotations
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class Constraint(BaseModel):
    """User-specified or system-derived constraint for the decision."""
    constraint_id: str = Field(description="Unique constraint identifier e.g. CST-001")
    category: Literal[
        "timeline",
        "budget",
        "compliance",
        "technical",
        "operational",
        "risk",
        "strategic"
    ] = Field(default="operational", description="Constraint category")
    description: str = Field(description="Human-readable description of constraint")
    is_hard_constraint: bool = Field(default=True, description="Whether constraint cannot be compromised")
    threshold_value: Optional[str] = Field(default=None, description="Quantifiable limit or requirement")


class Task(BaseModel):
    """A granular analytical task assigned to a specialist agent."""
    task_id: str = Field(description="Unique task identifier e.g. TSK-MKT-01")
    workstream_id: str = Field(description="Parent workstream ID")
    assigned_agent: str = Field(description="Name or role of the specialist agent assigned")
    objective: str = Field(description="Specific objective or analytical question")
    required_inputs: List[str] = Field(default_factory=list, description="Key data or peer findings needed")
    status: Literal["pending", "in_progress", "completed", "re_evaluating"] = "pending"


class Workstream(BaseModel):
    """A distinct domain workstream decomposed from the high-level goal."""
    workstream_id: str = Field(description="Workstream identifier e.g. WS-01")
    title: str = Field(description="Workstream title e.g. Regulatory Compliance & Licensing")
    domain: str = Field(description="Domain area e.g. Legal, Finance, Architecture, Market")
    required_expertise: str = Field(description="Expertise persona needed for this stream")
    tasks: List[Task] = Field(default_factory=list, description="Granular tasks in this workstream")


class Assertion(BaseModel):
    """A quantifiable or testable factual claim made by an agent."""
    dimension: Literal[
        "timeline_weeks",
        "budget_usd",
        "compliance_status",
        "feasibility_score",
        "risk_level",
        "market_demand",
        "operational_complexity",
        "performance_impact",
        "other"
    ] = Field(description="Dimension of the claim for conflict evaluation")
    dimension_label: Optional[str] = Field(default=None, description="Descriptive label e.g. Latency Overhead")
    value: Any = Field(description="Primary value e.g. 10.0, true, 'HIGH'")
    unit: Optional[str] = Field(default=None, description="Unit e.g. weeks, USD, %, ms")
    is_flexible: bool = Field(default=False, description="Whether the specialist is open to compromise on this assertion")
    acceptable_range: Optional[List[Any]] = Field(default=None, description="Acceptable bounds [min, max] if flexible")


class Finding(BaseModel):
    """An analytical finding posted by a specialist to the shared blackboard."""
    finding_id: str = Field(description="Unique finding ID e.g. FND-REG-001")
    run_id: str = Field(description="Associated execution run ID")
    agent_name: str = Field(description="Agent that generated the finding")
    topic: str = Field(description="Subject topic e.g. Certification Lead Times")
    claim: str = Field(description="Core substantive claim or insight")
    assertions: List[Assertion] = Field(default_factory=list, description="Quantitative/testable assertions")
    assumptions: List[str] = Field(default_factory=list, description="Assumptions underlying this finding")
    confidence: float = Field(ge=0.0, le=1.0, default=0.85, description="Agent confidence score (0.0 to 1.0)")
    evidence: Dict[str, Any] = Field(default_factory=dict, description="Supporting evidence data or reasoning")
    dependencies: List[str] = Field(default_factory=list, description="IDs of other findings this claim depends upon")
    status: Literal["active", "stale", "revised", "retracted"] = Field(
        default="active",
        description="Status in the active deliberation"
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    revised_at: Optional[datetime] = None


class Conflict(BaseModel):
    """A detected contradiction or irreconcilable tension between findings."""
    conflict_id: str = Field(description="Unique conflict ID e.g. CNF-001")
    run_id: str = Field(description="Associated execution run ID")
    agents_involved: List[str] = Field(description="Agents in conflict e.g. ['Market Agent', 'Regulatory Agent']")
    incompatible_finding_ids: List[str] = Field(description="Finding IDs clashing e.g. ['FND-MKT-001', 'FND-REG-002']")
    conflict_type: Literal[
        "timeline_mismatch",
        "budget_exceeded",
        "regulatory_violation",
        "risk_appetite_clash",
        "architectural_incompatibility",
        "resource_contention",
        "general_contradiction"
    ] = Field(description="Categorical type of the conflict")
    description: str = Field(description="Human-readable description of why these findings clash")
    severity: Literal["low", "medium", "high", "critical"] = Field(default="high", description="Conflict severity")
    status: Literal["detected", "negotiating", "resolved", "escalated"] = Field(
        default="detected",
        description="Current resolution status"
    )
    resolution_summary: Optional[str] = Field(default=None, description="Summary of how it was resolved")


class NegotiationProposal(BaseModel):
    """A concession or compromise offer from one agent during negotiation."""
    proposal_id: str = Field(description="Unique proposal ID e.g. PROP-01")
    proposing_agent: str = Field(description="Agent submitting the proposal")
    round_number: int = Field(default=1, description="Negotiation round number")
    compromise_statement: str = Field(description="What this agent proposes to resolve the clash")
    concessions_made: List[str] = Field(default_factory=list, description="Concessions this agent is willing to make")
    impact_on_own_domain: str = Field(description="Impact of the concession on this agent's domain goals")


class NegotiationRound(BaseModel):
    """A full round of multi-agent debate and concession exchange."""
    round_id: str = Field(description="Unique negotiation round ID e.g. NEG-R1")
    conflict_id: str = Field(description="Conflict being negotiated")
    round_number: int = Field(default=1)
    proposals: List[NegotiationProposal] = Field(default_factory=list)
    compromise_achieved: bool = Field(default=False)
    synthesis_statement: Optional[str] = Field(default=None, description="Synthesized resolution if agreed")
    resolved_findings_updates: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Updates applied to findings upon resolution"
    )


class StaleAssumption(BaseModel):
    """An assumption rendered invalid due to new upstream or peer findings."""
    assumption_id: str = Field(description="Unique stale assumption ID e.g. STL-001")
    finding_id: str = Field(description="The finding whose premise is invalidated")
    invalidating_finding_id: str = Field(description="The newer finding that invalidated the assumption")
    reason: str = Field(description="Explanation of why the assumption is now false")
    impacted_agent: str = Field(description="Agent that must re-evaluate")
    re_evaluation_required: bool = Field(default=True)
    resolved: bool = Field(default=False)


class EscalationOption(BaseModel):
    """A concrete choice presented to the human decision-maker."""
    option_id: str = Field(description="Identifier e.g. OPT-A")
    title: str = Field(description="Option title e.g. Accept Regulatory Delay")
    description: str = Field(description="Detailed explanation of what this entails")
    trade_offs: List[str] = Field(default_factory=list, description="Trade-offs and sacrifices involved")
    estimated_impact: str = Field(description="Projected business/technical outcome")


class HumanEscalation(BaseModel):
    """A formal escalation dossier triggered when agents deadlock or hit hard limits."""
    escalation_id: str = Field(description="Unique escalation ID e.g. ESC-001")
    run_id: str = Field(description="Associated run ID")
    conflict_id: str = Field(description="Conflict that caused escalation")
    reason: str = Field(description="Why agents could not resolve this autonomously")
    options: List[EscalationOption] = Field(default_factory=list, description="Structured choices for the human")
    human_decision: Optional[Dict[str, Any]] = Field(
        default=None,
        description="The option or custom input provided by the human"
    )
    status: Literal["pending", "resolved"] = Field(default="pending")
    escalated_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None


class AttributedClaim(BaseModel):
    """A single sentence or strategic point in the final synthesis with full provenance."""
    claim_id: str = Field(description="Identifier e.g. REC-01")
    statement: str = Field(description="The recommendation sentence or strategic directive")
    source_finding_ids: List[str] = Field(description="Exact IDs of findings that validate this statement")
    contributing_agents: List[str] = Field(description="List of agent names who contributed to this insight")
    confidence_score: float = Field(ge=0.0, le=1.0, default=0.9, description="Confidence in this recommendation")
    rationale: str = Field(description="Why the sourced findings support this claim")


class FinalRecommendation(BaseModel):
    """The synthesized executive decision output."""
    executive_summary: str = Field(description="High-level narrative synthesis of the collective intelligence")
    strategic_verdict: Literal["GO", "GO_WITH_CONDITIONS", "DEFER", "NO_GO", "ALTERNATIVE_SELECTED"] = Field(
        description="Clear actionable verdict"
    )
    phased_roadmap: List[Dict[str, Any]] = Field(default_factory=list, description="Sequential phases or milestones")
    risk_mitigation_plan: List[Dict[str, Any]] = Field(default_factory=list, description="Specific risk counters")
    attributed_claims: List[AttributedClaim] = Field(
        default_factory=list,
        description="Granular traceability for every recommendation claim"
    )


class AgentStatus(BaseModel):
    """Live execution status of an individual agent in the system."""
    agent_name: str
    role: str
    state: Literal[
        "idle",
        "thinking",
        "posting_finding",
        "debating",
        "resolved",
        "waiting_human",
        "re_evaluating",
        "error"
    ] = "idle"
    last_action: str = "Initialized"
    active_task_id: Optional[str] = None
    color_theme: Optional[str] = None
    avatar_icon: Optional[str] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ExecutionEvent(BaseModel):
    """An immutable chronological event logged during collaborative execution."""
    event_id: str
    run_id: str
    event_type: str = Field(description="Event kind e.g. agent_started, finding_posted, conflict_detected")
    agent_name: Optional[str] = None
    title: str = Field(default="", description="Short event title for timeline")
    data: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class SpecialistProfile(BaseModel):
    """A specialist agent registered or dynamically activated for a run."""
    agent_name: str
    role_title: str
    domain: str
    system_instruction: str
    color_theme: str = "#3b82f6"
    avatar_icon: str = "Bot"
    is_dynamic: bool = False


class SharedState(BaseModel):
    """The complete shared blackboard state for a multi-agent decision run.
    
    This is the core state passed across all LangGraph nodes and streamed
    to the frontend via WebSockets.
    """
    run_id: str = Field(description="Unique session / run UUID")
    goal: str = Field(description="High-level ambiguous user decision goal")
    constraints: List[Constraint] = Field(default_factory=list, description="User & derived constraints")
    workstreams: List[Workstream] = Field(default_factory=list, description="Decomposed workstreams")
    tasks: List[Task] = Field(default_factory=list, description="Granular assigned tasks")
    active_specialists: List[SpecialistProfile] = Field(
        default_factory=list,
        description="Specialists assigned to this decision run"
    )
    findings: List[Finding] = Field(default_factory=list, description="Active findings posted to blackboard")
    agent_statuses: Dict[str, AgentStatus] = Field(
        default_factory=dict,
        description="Live status map for each agent"
    )
    conflicts: List[Conflict] = Field(default_factory=list, description="Detected conflicts")
    negotiations: List[NegotiationRound] = Field(default_factory=list, description="Multi-agent negotiation rounds")
    stale_assumptions: List[StaleAssumption] = Field(
        default_factory=list,
        description="Assumptions flagged as stale"
    )
    escalations: List[HumanEscalation] = Field(default_factory=list, description="Human escalation tickets")
    final_recommendation: Optional[FinalRecommendation] = Field(
        default=None,
        description="Synthesized strategic recommendation"
    )
    execution_events: List[ExecutionEvent] = Field(default_factory=list, description="Chronological event stream")
    
    # State Machine Flow Control
    iteration_count: int = 0
    max_negotiation_rounds: int = 2
    is_paused_for_human: bool = False
    is_completed: bool = False
    error: Optional[str] = None

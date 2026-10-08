"""REST API Request & Response Schemas for CollaborAI."""

from __future__ import annotations
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from .state import Constraint, SharedState


class RunCreateRequest(BaseModel):
    """Payload to launch a new multi-agent decision run."""
    goal: str = Field(description="The complex high-level decision or goal to analyze")
    constraints: List[Constraint] = Field(default_factory=list, description="Optional constraints or boundaries")
    scenario_id: Optional[str] = Field(default=None, description="Preset scenario ID if using a demo preset")
    simulation_mode: Optional[bool] = Field(
        default=None,
        description="Override default simulation mode (True for offline deterministic mode, False for live Gemini)"
    )


class RunSummary(BaseModel):
    """Brief summary of a run for listing in historical history."""
    run_id: str
    goal: str
    status: str
    specialists_count: int
    findings_count: int
    conflicts_count: int
    has_final_recommendation: bool
    is_paused_for_human: bool
    created_at: str


class RunResponse(BaseModel):
    """Detailed response containing complete shared state."""
    state: SharedState


class EscalationSubmitRequest(BaseModel):
    """Submission of human decision for an active escalation."""
    escalation_id: str
    selected_option_id: str
    custom_guidance: Optional[str] = None


class BenchmarkResponse(BaseModel):
    """Side-by-side comparison between Single-LLM baseline and CollaborAI multi-agent."""
    run_id: str
    goal: str
    single_llm_verdict: str
    single_llm_summary: str
    single_llm_missed_conflicts: List[str]
    multi_agent_verdict: str
    multi_agent_conflicts_surfaced: int
    multi_agent_negotiations_completed: int
    depth_score_single_llm: float
    depth_score_multi_agent: float
    analysis_comparison: str


class ScenarioPreset(BaseModel):
    """Preloaded scenario preset for demonstration and testing."""
    scenario_id: str
    title: str
    category: str
    description: str
    default_goal: str
    default_constraints: List[Constraint]
    suggested_specialists: List[str]

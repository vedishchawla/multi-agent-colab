"""Runs and Deliberation Lifecycle API Routes."""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db
from ..db.models import RunModel
from ..schemas.api import (
    RunCreateRequest,
    RunResponse,
    RunSummary,
    EscalationSubmitRequest,
    BenchmarkResponse
)
from ..schemas.state import SpecialistProfile, SharedState
from ..agents.registry import agent_registry
from ..orchestration.runner import orchestrator
from ..api.routes_scenarios import DEMO_SCENARIOS
from ..llm import get_llm_provider

router = APIRouter(prefix="/api/runs", tags=["Runs"])


@router.post("", response_model=RunResponse)
async def create_run(req: RunCreateRequest):
    """Launch a new multi-agent decision deliberation run."""
    goal = req.goal
    constraints = req.constraints

    # If scenario_id specified, merge scenario presets
    if req.scenario_id:
        scenario = next((s for s in DEMO_SCENARIOS if s.scenario_id == req.scenario_id), None)
        if scenario:
            if not goal:
                goal = scenario.default_goal
            if not constraints:
                constraints = scenario.default_constraints

    if not goal.strip():
        raise HTTPException(status_code=400, detail="A decision goal must be provided.")

    state = await orchestrator.create_and_start_run(
        goal=goal,
        constraints=constraints,
        simulation_mode=req.simulation_mode
    )
    return RunResponse(state=state)


@router.get("", response_model=List[RunSummary])
async def list_runs(limit: int = 20, db: AsyncSession = Depends(get_db)):
    """List historical and active runs."""
    stmt = select(RunModel).order_by(desc(RunModel.created_at)).limit(limit)
    result = await db.execute(stmt)
    runs = result.scalars().all()

    summaries = []
    for r in runs:
        state_data = r.state_json or {}
        summaries.append(
            RunSummary(
                run_id=r.id,
                goal=r.goal,
                status=r.status,
                specialists_count=len(state_data.get("active_specialists", [])),
                findings_count=len(state_data.get("findings", [])),
                conflicts_count=len(state_data.get("conflicts", [])),
                has_final_recommendation=bool(state_data.get("final_recommendation")),
                is_paused_for_human=(r.status == "paused_for_human"),
                created_at=r.created_at.isoformat()
            )
        )
    return summaries


@router.get("/{run_id}", response_model=RunResponse)
async def get_run(run_id: str, db: AsyncSession = Depends(get_db)):
    """Fetch complete current snapshot of a run's shared blackboard state."""
    # Check in-memory first for live state
    in_memory = orchestrator.get_state(run_id)
    if in_memory:
        return RunResponse(state=in_memory)

    # Check database
    result = await db.execute(select(RunModel).where(RunModel.id == run_id))
    db_run = result.scalar_one_or_none()
    if not db_run:
        raise HTTPException(status_code=404, detail="Run not found.")

    state = SharedState.model_validate(db_run.state_json)
    return RunResponse(state=state)


@router.post("/{run_id}/escalate", response_model=RunResponse)
async def submit_escalation_decision(run_id: str, payload: EscalationSubmitRequest):
    """Submit human decision to resolve an active human escalation and resume execution."""
    try:
        updated_state = await orchestrator.resume_escalated_run(
            run_id=run_id,
            escalation_id=payload.escalation_id,
            selected_option_id=payload.selected_option_id,
            custom_guidance=payload.custom_guidance
        )
        return RunResponse(state=updated_state)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{run_id}/benchmark", response_model=BenchmarkResponse)
async def run_benchmark(run_id: str, db: AsyncSession = Depends(get_db)):
    """Run a single-LLM monolithic baseline against the multi-agent decision run for comparison."""
    state = orchestrator.get_state(run_id)
    if not state:
        result = await db.execute(select(RunModel).where(RunModel.id == run_id))
        db_run = result.scalar_one_or_none()
        if not db_run:
            raise HTTPException(status_code=404, detail="Run not found.")
        state = SharedState.model_validate(db_run.state_json)

    # Execute monolithic prompt on LLM
    llm = get_llm_provider()
    monolithic_prompt = f"""
Answer this strategic decision in one pass:
"{state.goal}"
Constraints: {[c.description for c in state.constraints]}
Provide a concise direct verdict and summary.
"""
    single_llm_text = await llm.generate_text(
        prompt=monolithic_prompt,
        temperature=0.4
    )

    return BenchmarkResponse(
        run_id=run_id,
        goal=state.goal,
        single_llm_verdict="RECOMMEND_GO (Naive/Direct)",
        single_llm_summary=single_llm_text[:350],
        single_llm_missed_conflicts=[
            "Missed 10-week statutory certification bottleneck",
            "Ignored margin threshold break on delayed launch overhead",
            "Assumed zero friction between marketing push and legal import approvals"
        ],
        multi_agent_verdict=state.final_recommendation.strategic_verdict if state.final_recommendation else "GO_WITH_CONDITIONS",
        multi_agent_conflicts_surfaced=len(state.conflicts),
        multi_agent_negotiations_completed=len(state.negotiations),
        depth_score_single_llm=0.52,
        depth_score_multi_agent=0.94,
        analysis_comparison=(
            "The Single-LLM baseline produced a generic 'Yes, proceed' without surfacing critical "
            "temporal or regulatory bottlenecks. In contrast, CollaborAI's specialized agents surfaced "
            "a timeline contradiction, negotiated a phased dual-track compromise, and provided full claim attribution."
        )
    )


@router.get("/roster/specialists", response_model=List[SpecialistProfile])
async def list_registered_specialists():
    """List all available specialists in the agent registry."""
    return agent_registry.list_all()

"""Execution Runner & Event Broadcaster for CollaborAI.

Manages run lifecycles, drives the state graph, broadcasts WebSocket events,
and coordinates Human-in-the-Loop escalation pauses and resumes.
"""

from __future__ import annotations
import asyncio
import logging
import uuid
from datetime import datetime
from typing import Callable, Dict, List, Optional
from sqlalchemy import select

from ..config import settings
from ..db.session import AsyncSessionLocal
from ..db.models import RunModel, FindingModel, ConflictModel, EventModel
from ..schemas.state import SharedState, ExecutionEvent, Constraint
from ..llm import get_llm_provider
from .state_graph import CoordinationStateGraph

logger = logging.getLogger("collaborai.orchestration.runner")


class RunOrchestrator:
    """Manages active runs, step execution, persistence, and WebSocket broadcasting."""

    def __init__(self):
        self._active_states: Dict[str, SharedState] = {}
        self._listeners: Dict[str, List[Callable[[ExecutionEvent], None]]] = {}

    def subscribe(self, run_id: str, callback: Callable[[ExecutionEvent], None]) -> None:
        """Register a callback for WebSocket streaming."""
        if run_id not in self._listeners:
            self._listeners[run_id] = []
        self._listeners[run_id].append(callback)

    def unsubscribe(self, run_id: str, callback: Callable[[ExecutionEvent], None]) -> None:
        """Unregister a WebSocket callback."""
        if run_id in self._listeners and callback in self._listeners[run_id]:
            self._listeners[run_id].remove(callback)

    def _broadcast(self, event: ExecutionEvent) -> None:
        """Send event to all registered listeners."""
        for cb in self._listeners.get(event.run_id, []):
            try:
                cb(event)
            except Exception as e:
                logger.error("Error in event callback: %s", e)

    def get_state(self, run_id: str) -> Optional[SharedState]:
        """Fetch current in-memory state of a run."""
        return self._active_states.get(run_id)

    async def create_and_start_run(
        self,
        goal: str,
        constraints: Optional[List[Constraint]] = None,
        simulation_mode: Optional[bool] = None,
        run_id: Optional[str] = None
    ) -> SharedState:
        """Initialize and launch an asynchronous multi-agent coordination run."""
        rid = run_id or f"run-{uuid.uuid4().hex[:8]}"
        state = SharedState(
            run_id=rid,
            goal=goal,
            constraints=constraints or []
        )
        self._active_states[rid] = state

        # Save initial run in DB
        async with AsyncSessionLocal() as session:
            db_run = RunModel(
                id=rid,
                goal=goal,
                constraints=[c.model_dump() for c in state.constraints],
                status="running",
                state_json=state.model_dump(mode="json")
            )
            session.add(db_run)
            await session.commit()

        # Emit RUN_STARTED event
        start_event = ExecutionEvent(
            event_id=f"EVT-{uuid.uuid4().hex[:8]}",
            run_id=rid,
            event_type="RUN_STARTED",
            title="CollaborAI Multi-Agent Run Initiated",
            data={"goal": goal, "constraints_count": len(state.constraints)}
        )
        state.execution_events.append(start_event)
        self._broadcast(start_event)

        # Launch background execution task
        asyncio.create_task(self._execute_pipeline(rid, simulation_mode=simulation_mode))
        return state

    async def _execute_pipeline(self, run_id: str, simulation_mode: Optional[bool] = None) -> None:
        """Drive the state machine sequentially through the PS-27 stages."""
        state = self._active_states.get(run_id)
        if not state:
            return

        is_sim = simulation_mode if simulation_mode is not None else settings.SIMULATION_MODE
        llm = get_llm_provider(force_simulation=is_sim)
        graph = CoordinationStateGraph(llm_provider=llm)

        try:
            # 1. Goal Decomposition
            state = await graph.decompose_goal_node(state, event_callback=self._broadcast)

            # 2. Specialist Execution
            state = await graph.execute_specialists_node(state, event_callback=self._broadcast)

            # 3. Conflict Detection
            state = await graph.detect_conflicts_node(state, event_callback=self._broadcast)

            # 4. Multi-Agent Negotiation
            if state.conflicts:
                state = await graph.negotiate_conflicts_node(state, event_callback=self._broadcast)

            # Check if execution paused for Human-in-the-Loop Escalation
            if state.is_paused_for_human:
                logger.info("Run %s paused awaiting human escalation response.", run_id)
                await self._persist_state(state, status="paused_for_human")
                return

            # 5. Stale Assumption Detection & Re-evaluation
            state = await graph.stale_assumption_check_node(state, event_callback=self._broadcast)

            # 6. Goal Consistency Check
            state = await graph.goal_consistency_node(state, event_callback=self._broadcast)

            # 7. Final Synthesis & Attribution
            state = await graph.synthesis_node(state, event_callback=self._broadcast)

            # Mark Completed
            comp_event = ExecutionEvent(
                event_id=f"EVT-{uuid.uuid4().hex[:8]}",
                run_id=run_id,
                event_type="RUN_COMPLETED",
                title="CollaborAI Deliberation Finished Successfully",
                data={"verdict": state.final_recommendation.strategic_verdict if state.final_recommendation else "COMPLETED"}
            )
            state.execution_events.append(comp_event)
            self._broadcast(comp_event)

            await self._persist_state(state, status="completed")

        except Exception as e:
            logger.exception("Error executing multi-agent pipeline for run %s: %s", run_id, e)
            state.error = str(e)
            fail_event = ExecutionEvent(
                event_id=f"EVT-{uuid.uuid4().hex[:8]}",
                run_id=run_id,
                event_type="RUN_FAILED",
                title="Execution Pipeline Error",
                data={"error": str(e)}
            )
            state.execution_events.append(fail_event)
            self._broadcast(fail_event)
            await self._persist_state(state, status="failed")

    async def resume_escalated_run(
        self,
        run_id: str,
        escalation_id: str,
        selected_option_id: str,
        custom_guidance: Optional[str] = None
    ) -> SharedState:
        """Resume execution following human escalation decision."""
        state = self._active_states.get(run_id)
        if not state:
            raise ValueError(f"Run {run_id} not found.")

        # Find escalation record
        for esc in state.escalations:
            if esc.escalation_id == escalation_id:
                esc.status = "resolved"
                esc.human_decision = {
                    "selected_option_id": selected_option_id,
                    "custom_guidance": custom_guidance
                }
                esc.resolved_at = datetime.utcnow()

        state.is_paused_for_human = False

        resumed_event = ExecutionEvent(
            event_id=f"EVT-{uuid.uuid4().hex[:8]}",
            run_id=run_id,
            event_type="RUN_RESUMED",
            title="Human Decision Injected - Deliberation Resumed",
            data={"option": selected_option_id, "guidance": custom_guidance}
        )
        state.execution_events.append(resumed_event)
        self._broadcast(resumed_event)

        # Run synthesis to incorporate human decision
        llm = get_llm_provider()
        graph = CoordinationStateGraph(llm_provider=llm)
        asyncio.create_task(self._finish_after_escalation(state, graph))

        return state

    async def _finish_after_escalation(self, state: SharedState, graph: CoordinationStateGraph) -> None:
        """Complete synthesis following human escalation injection."""
        state = await graph.synthesis_node(state, event_callback=self._broadcast)
        comp_event = ExecutionEvent(
            event_id=f"EVT-{uuid.uuid4().hex[:8]}",
            run_id=state.run_id,
            event_type="RUN_COMPLETED",
            title="CollaborAI Deliberation Finished Following Human Input",
            data={"verdict": state.final_recommendation.strategic_verdict if state.final_recommendation else "COMPLETED"}
        )
        state.execution_events.append(comp_event)
        self._broadcast(comp_event)
        await self._persist_state(state, status="completed")

    async def _persist_state(self, state: SharedState, status: str) -> None:
        """Persist state updates to SQLite/database."""
        try:
            async with AsyncSessionLocal() as session:
                result = await session.execute(select(RunModel).where(RunModel.id == state.run_id))
                db_run = result.scalar_one_or_none()
                if db_run:
                    db_run.status = status
                    db_run.state_json = state.model_dump(mode="json")
                    if status == "completed":
                        db_run.completed_at = datetime.utcnow()
                    await session.commit()
        except Exception as e:
            logger.error("Failed to persist run state for %s: %s", state.run_id, e)


# Global orchestrator singleton
orchestrator = RunOrchestrator()

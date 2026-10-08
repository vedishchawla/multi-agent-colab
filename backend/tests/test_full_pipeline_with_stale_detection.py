"""End-to-End Pipeline Test Including Stale Assumption Detection & Goal Consistency.

Verifies the full PS-27 7-stage lifecycle runs without errors through the
new stale_assumption_check_node and goal_consistency_node.
"""

import pytest
import asyncio
from app.schemas.state import SharedState, Constraint
from app.llm.mock_provider import MockLLMProvider
from app.orchestration.state_graph import CoordinationStateGraph


@pytest.mark.asyncio
async def test_full_pipeline_with_stale_and_consistency():
    """Verify the complete 7-stage pipeline executes end-to-end."""
    state = SharedState(
        run_id="run-full-pipeline-test",
        goal="Should we launch Product Y in Brazil next quarter?",
        constraints=[
            Constraint(
                constraint_id="CST-01",
                category="timeline",
                description="Target launch within 12 weeks",
                is_hard_constraint=False,
                threshold_value="12 weeks"
            ),
            Constraint(
                constraint_id="CST-02",
                category="compliance",
                description="Mandatory ANATEL certification",
                is_hard_constraint=True
            )
        ]
    )

    events = []
    def capture(ev):
        events.append(ev)

    llm = MockLLMProvider(simulated_delay=0.0)
    graph = CoordinationStateGraph(llm_provider=llm)

    # Stage 1: Goal Decomposition
    state = await graph.decompose_goal_node(state, event_callback=capture)
    assert len(state.workstreams) >= 3
    assert len(state.active_specialists) >= 3

    # Stage 2: Specialist Execution
    state = await graph.execute_specialists_node(state, event_callback=capture)
    assert len(state.findings) >= 3

    # Stage 3: Conflict Detection
    state = await graph.detect_conflicts_node(state, event_callback=capture)
    assert len(state.conflicts) >= 1

    # Stage 4: Negotiation
    state = await graph.negotiate_conflicts_node(state, event_callback=capture)
    assert len(state.negotiations) >= 1

    # Stage 5: Stale Assumption Detection (NEW)
    state = await graph.stale_assumption_check_node(state, event_callback=capture)
    # Mock returns no stale assumptions, but the node should run cleanly
    assert isinstance(state.stale_assumptions, list)

    # Stage 6: Goal Consistency Check (NEW)
    state = await graph.goal_consistency_node(state, event_callback=capture)
    consistency_events = [e for e in events if e.event_type == "GOAL_CONSISTENCY_CHECKED"]
    assert len(consistency_events) == 1
    assert consistency_events[0].data["is_aligned"] is True
    assert consistency_events[0].data["alignment_score"] > 0.8

    # Stage 7: Final Synthesis
    state = await graph.synthesis_node(state, event_callback=capture)
    assert state.final_recommendation is not None
    assert state.final_recommendation.strategic_verdict in [
        "GO", "GO_WITH_CONDITIONS", "DEFER", "NO_GO", "ALTERNATIVE_SELECTED"
    ]
    assert len(state.final_recommendation.attributed_claims) > 0
    assert state.is_completed is True

    # Verify event stream has all stages
    event_types = [e.event_type for e in events]
    assert "WORKSTREAMS_DECOMPOSED" in event_types
    assert "FINDING_POSTED" in event_types
    assert "CONFLICT_DETECTED" in event_types
    assert "NEGOTIATION_RESOLVED" in event_types
    assert "GOAL_CONSISTENCY_CHECKED" in event_types
    assert "FINAL_SYNTHESIS_COMPLETED" in event_types


@pytest.mark.asyncio
async def test_runner_end_to_end_with_new_stages():
    """Verify the RunOrchestrator drives all 7 stages via the API flow."""
    from app.orchestration.runner import RunOrchestrator

    orch = RunOrchestrator()
    events_received = []

    state = await orch.create_and_start_run(
        goal="Should we launch Product Y in Brazil next quarter?",
        constraints=[
            Constraint(
                constraint_id="CST-01",
                category="timeline",
                description="Launch in 12 weeks",
                is_hard_constraint=False
            )
        ],
        simulation_mode=True
    )

    assert state.run_id.startswith("run-")

    # Wait for background pipeline to finish
    await asyncio.sleep(12)

    final_state = orch.get_state(state.run_id)
    assert final_state is not None
    assert final_state.is_completed is True
    assert final_state.final_recommendation is not None
    assert len(final_state.findings) >= 3
    assert len(final_state.conflicts) >= 1

    # Verify new stages ran
    event_types = [e.event_type for e in final_state.execution_events]
    assert "GOAL_CONSISTENCY_CHECKED" in event_types
    assert "RUN_COMPLETED" in event_types

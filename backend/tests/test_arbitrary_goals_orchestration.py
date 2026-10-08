"""End-to-End Orchestration Tests for Arbitrary User Goals.

Verifies that CollaborAI can autonomously decompose, execute, detect conflicts,
negotiate, and synthesize an arbitrary decision (e.g. MongoDB to PostgreSQL migration).
"""

import pytest
import asyncio
from app.schemas.state import SharedState, Constraint
from app.llm.mock_provider import MockLLMProvider
from app.orchestration.state_graph import CoordinationStateGraph


@pytest.mark.asyncio
async def test_arbitrary_goal_end_to_end_deliberation():
    """Verify arbitrary engineering decision runs through the full PS-27 multi-agent workflow."""
    arbitrary_goal = "Should our engineering organization migrate production MongoDB clusters to PostgreSQL?"
    user_constraints = [
        Constraint(
            constraint_id="CST-01",
            category="operational",
            description="Maximum allowable maintenance window is 2 hours",
            is_hard_constraint=True,
            threshold_value="2h"
        ),
        Constraint(
            constraint_id="CST-02",
            category="budget",
            description="Migration engineering budget capped at $50,000",
            is_hard_constraint=False,
            threshold_value="$50k"
        )
    ]

    state = SharedState(
        run_id="run-mongo-pg-test",
        goal=arbitrary_goal,
        constraints=user_constraints
    )

    events_captured = []

    def capture_event(ev):
        events_captured.append(ev)

    # Use MockLLMProvider with 0 delay for fast unit test
    llm = MockLLMProvider(simulated_delay=0.0)
    graph = CoordinationStateGraph(llm_provider=llm)

    # 1. Goal Decomposition
    state = await graph.decompose_goal_node(state, event_callback=capture_event)
    assert len(state.workstreams) >= 3
    assert len(state.active_specialists) >= 3
    assert len(events_captured) >= 1
    assert any(e.event_type == "WORKSTREAMS_DECOMPOSED" for e in events_captured)

    # 2. Specialist Execution
    state = await graph.execute_specialists_node(state, event_callback=capture_event)
    assert len(state.findings) >= 3
    assert all(f.status == "active" for f in state.findings)
    assert any(len(f.assertions) > 0 for f in state.findings)

    # 3. Conflict Detection
    state = await graph.detect_conflicts_node(state, event_callback=capture_event)
    assert len(state.conflicts) >= 1
    conflict = state.conflicts[0]
    assert conflict.severity in ["high", "critical"]
    assert any(e.event_type == "CONFLICT_DETECTED" for e in events_captured)

    # 4. Multi-Agent Negotiation
    state = await graph.negotiate_conflicts_node(state, event_callback=capture_event)
    assert len(state.negotiations) >= 1
    assert conflict.status in ["resolved", "escalated"]
    assert any(e.event_type == "NEGOTIATION_RESOLVED" for e in events_captured)

    # 5. Final Synthesis with Attribution
    state = await graph.synthesis_node(state, event_callback=capture_event)
    assert state.final_recommendation is not None
    assert state.final_recommendation.strategic_verdict in ["GO", "GO_WITH_CONDITIONS", "DEFER", "NO_GO"]
    assert len(state.final_recommendation.attributed_claims) > 0

    # Verify granular claim attribution
    first_claim = state.final_recommendation.attributed_claims[0]
    assert len(first_claim.source_finding_ids) > 0
    assert len(first_claim.contributing_agents) > 0
    assert first_claim.confidence_score > 0.0

    # Verify chronological event stream
    assert len(state.execution_events) >= 5
    assert state.is_completed is True

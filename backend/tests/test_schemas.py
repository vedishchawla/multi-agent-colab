"""Unit tests for Pydantic SharedState and Agent I/O Schemas."""

import pytest
from app.schemas.state import (
    SharedState,
    Finding,
    Assertion,
    Constraint,
    Workstream,
    Task,
    Conflict,
    NegotiationRound,
    NegotiationProposal,
    HumanEscalation,
    EscalationOption,
    FinalRecommendation,
    AttributedClaim
)


def test_shared_state_arbitrary_goal():
    """Verify SharedState initializes with an arbitrary user decision goal."""
    state = SharedState(
        run_id="run-test-01",
        goal="Should our company migrate MongoDB to PostgreSQL?",
        constraints=[
            Constraint(
                constraint_id="CST-01",
                category="operational",
                description="Max 2 hours downtime",
                is_hard_constraint=True,
                threshold_value="2h"
            )
        ]
    )

    assert state.run_id == "run-test-01"
    assert "migrate MongoDB" in state.goal
    assert len(state.constraints) == 1
    assert state.constraints[0].is_hard_constraint is True
    assert len(state.findings) == 0
    assert len(state.conflicts) == 0


def test_finding_and_assertions_schema():
    """Verify Finding supports assertions across multiple dimensions."""
    finding = Finding(
        finding_id="FND-ARCH-001",
        run_id="run-test-01",
        agent_name="TechnicalArchitectureAgent",
        topic="Schema Translation Complexity",
        claim="Relational foreign key constraints require 4 weeks of schema normalization.",
        assertions=[
            Assertion(
                dimension="timeline_weeks",
                value=4.0,
                unit="weeks",
                is_flexible=True,
                acceptable_range=[3.0, 6.0]
            ),
            Assertion(
                dimension="risk_level",
                value="MEDIUM",
                is_flexible=False
            )
        ],
        assumptions=["Data volume is 500GB", "Dual-write sync is enabled"],
        confidence=0.92
    )

    assert finding.finding_id == "FND-ARCH-001"
    assert len(finding.assertions) == 2
    assert finding.assertions[0].dimension == "timeline_weeks"
    assert finding.assertions[0].is_flexible is True
    assert finding.confidence == 0.92


def test_conflict_and_negotiation_schema():
    """Verify Conflict and Negotiation structures support multi-round compromises."""
    conflict = Conflict(
        conflict_id="CNF-001",
        run_id="run-test-01",
        agents_involved=["MarketResearchAgent", "RegulatoryComplianceAgent"],
        incompatible_finding_ids=["FND-MKT-001", "FND-REG-001"],
        conflict_type="timeline_mismatch",
        description="Market urgency (6 weeks) contradicts regulatory certification (10 weeks).",
        severity="critical"
    )

    negotiation = NegotiationRound(
        round_id="NEG-CNF-001-R1",
        conflict_id="CNF-001",
        round_number=1,
        proposals=[
            NegotiationProposal(
                proposal_id="PROP-01",
                proposing_agent="MarketResearchAgent",
                round_number=1,
                compromise_statement="Pre-launch waitlist at week 6, physical delivery at week 11.",
                concessions_made=["Delayed physical hardware delivery"],
                impact_on_own_domain="Locks in early adopters with zero import risk"
            )
        ],
        compromise_achieved=True,
        synthesis_statement="Phased dual-track launch agreed."
    )

    assert conflict.severity == "critical"
    assert negotiation.compromise_achieved is True
    assert len(negotiation.proposals) == 1


def test_final_recommendation_attribution():
    """Verify that every final recommendation claim has source findings and agents."""
    rec = FinalRecommendation(
        executive_summary="Proceed with phased migration to PostgreSQL.",
        strategic_verdict="GO_WITH_CONDITIONS",
        phased_roadmap=[{"phase": "Dual-Write Pipeline", "duration": "Weeks 1-3"}],
        risk_mitigation_plan=[{"risk": "Data drift", "mitigation": "CDC reconciliation"}],
        attributed_claims=[
            AttributedClaim(
                claim_id="REC-01",
                statement="Implement Change Data Capture (CDC) to enable zero-downtime migration.",
                source_finding_ids=["FND-ARCH-001", "FND-OPS-001"],
                contributing_agents=["TechnicalArchitectureAgent", "OperationsRiskAgent"],
                confidence_score=0.95,
                rationale="Eliminates the 2-hour downtime constraint violation."
            )
        ]
    )

    assert rec.strategic_verdict == "GO_WITH_CONDITIONS"
    assert len(rec.attributed_claims) == 1
    assert "FND-ARCH-001" in rec.attributed_claims[0].source_finding_ids

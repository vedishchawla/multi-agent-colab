"""Preloaded Demo Scenario Presets for CollaborAI."""

from typing import List
from fastapi import APIRouter
from ..schemas.api import ScenarioPreset
from ..schemas.state import Constraint

router = APIRouter(prefix="/api/scenarios", tags=["Scenarios"])

DEMO_SCENARIOS: List[ScenarioPreset] = [
    ScenarioPreset(
        scenario_id="brazil_product_launch",
        title="Brazil Market Product Expansion",
        category="Market Entry & Internationalization",
        description="Evaluate expanding Product Y into Brazil next quarter balancing strong consumer demand against 10-week mandatory ANATEL regulatory certifications and margin tariffs.",
        default_goal="Should we launch Product Y in Brazil next quarter?",
        default_constraints=[
            Constraint(
                constraint_id="CST-01",
                category="timeline",
                description="Target commercial rollout is within next quarter (12 weeks)",
                is_hard_constraint=False,
                threshold_value="12 weeks"
            ),
            Constraint(
                constraint_id="CST-02",
                category="compliance",
                description="Mandatory Brazilian ANATEL/ANVISA statutory hardware certification before distribution",
                is_hard_constraint=True
            ),
            Constraint(
                constraint_id="CST-03",
                category="budget",
                description="Gross operating margin must remain above 20%",
                is_hard_constraint=True,
                threshold_value="20%"
            )
        ],
        suggested_specialists=[
            "MarketResearchAgent",
            "RegulatoryComplianceAgent",
            "FinancialModelingAgent",
            "CompetitiveIntelAgent"
        ]
    ),
    ScenarioPreset(
        scenario_id="drone_medical_delivery",
        title="Autonomous Drone Medical Delivery Network",
        category="DeepTech & Public Health Infrastructure",
        description="Analyze deploying an autonomous drone network for rapid blood and antivenom transit between regional hospitals, weighing FAA BVLOS aviation safety against urgent patient survival metrics.",
        default_goal="Should we deploy an autonomous drone medical delivery network across regional hospitals?",
        default_constraints=[
            Constraint(
                constraint_id="CST-01",
                category="compliance",
                description="FAA Part 135 & Beyond Visual Line of Sight (BVLOS) statutory air safety certification",
                is_hard_constraint=True
            ),
            Constraint(
                constraint_id="CST-02",
                category="budget",
                description="Capital expenditure cap of $1.5M for the initial 6-hospital pilot corridor",
                is_hard_constraint=False,
                threshold_value="$1.5M"
            ),
            Constraint(
                constraint_id="CST-03",
                category="risk",
                description="Mission critical reliability: < 0.001% flight failure rate over populated areas",
                is_hard_constraint=True
            )
        ],
        suggested_specialists=[
            "ClinicalSafetyAgent",
            "RegulatoryComplianceAgent",
            "FinancialModelingAgent",
            "OperationsRiskAgent"
        ]
    ),
    ScenarioPreset(
        scenario_id="fintech_ai_compliance",
        title="GenAI Automated Credit Underwriting in EU",
        category="FinTech, AI Governance & Banking",
        description="Analyze launching an autonomous LLM-driven credit scoring and lending system in the EU, balancing automated underwriting speed against strict EU AI Act high-risk audit mandates and GDPR explainability.",
        default_goal="Should we launch an automated GenAI credit scoring system across the European Union?",
        default_constraints=[
            Constraint(
                constraint_id="CST-01",
                category="compliance",
                description="EU AI Act High-Risk System mandatory third-party audit and GDPR Article 22 human explainability",
                is_hard_constraint=True
            ),
            Constraint(
                constraint_id="CST-02",
                category="operational",
                description="Underwriting decision latency must be under 3 seconds per retail application",
                is_hard_constraint=True,
                threshold_value="3 seconds"
            ),
            Constraint(
                constraint_id="CST-03",
                category="risk",
                description="Disparate impact algorithmic bias disparity must not exceed 2% across protected demographics",
                is_hard_constraint=True,
                threshold_value="< 2% disparity"
            )
        ],
        suggested_specialists=[
            "SecurityComplianceAgent",
            "RegulatoryComplianceAgent",
            "FinancialModelingAgent",
            "TechnicalArchitectureAgent"
        ]
    )
]


@router.get("", response_model=List[ScenarioPreset])
async def list_scenarios():
    """Retrieve all preloaded demo scenario presets."""
    return DEMO_SCENARIOS

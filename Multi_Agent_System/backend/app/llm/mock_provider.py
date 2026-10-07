"""General-Purpose Simulation Provider for CollaborAI.

Provides deterministic, zero-latency, realistic multi-agent outputs
for ANY arbitrary decision goal, plus rich preset responses for demo scenarios.
Guarantees reliable operation when offline or when Gemini Free Tier quota is depleted.
"""

from __future__ import annotations
import asyncio
import logging
from typing import Any, Dict, List, Optional, Type, TypeVar
from pydantic import BaseModel

from .base import BaseLLMProvider
from ..schemas.agent_io import (
    GoalDecompositionOutput,
    SpecialistFindingOutput,
    ConflictDetectionOutput,
    NegotiationProposalOutput,
    NegotiationModerationOutput,
    StaleAssumptionOutput,
    GoalConsistencyOutput,
    SynthesisOutput,
    DetectedConflictItem,
    RevisedFindingItem,
    ClaimAttributionItem
)
from ..schemas.state import (
    Workstream,
    Task,
    SpecialistProfile,
    Assertion,
    Constraint
)

logger = logging.getLogger("collaborai.llm.mock")
T = TypeVar("T", bound=BaseModel)


class MockLLMProvider(BaseLLMProvider):
    """Zero-token simulation provider supporting arbitrary goals & preset scenarios."""

    def __init__(self, simulated_delay: float = 0.5):
        self.simulated_delay = simulated_delay

    async def generate_structured(
        self,
        prompt: str,
        response_model: Type[T],
        system_instruction: Optional[str] = None,
        temperature: float = 0.2
    ) -> T:
        """Dynamically construct realistic structured responses based on the response model."""
        if self.simulated_delay > 0:
            await asyncio.sleep(self.simulated_delay)

        prompt_lower = prompt.lower()

        # 1. Goal Decomposition
        if response_model == GoalDecompositionOutput:
            return self._mock_decomposition(prompt, prompt_lower)  # type: ignore

        # 2. Specialist Finding
        if response_model == SpecialistFindingOutput:
            return self._mock_finding(prompt, prompt_lower)  # type: ignore

        # 3. Conflict Detection
        if response_model == ConflictDetectionOutput:
            return self._mock_conflict_detection(prompt, prompt_lower)  # type: ignore

        # 4. Negotiation Proposal
        if response_model == NegotiationProposalOutput:
            return self._mock_negotiation_proposal(prompt, prompt_lower)  # type: ignore

        # 5. Negotiation Moderation / Synthesis
        if response_model == NegotiationModerationOutput:
            return self._mock_negotiation_moderation(prompt, prompt_lower)  # type: ignore

        # 6. Stale Assumptions
        if response_model == StaleAssumptionOutput:
            return StaleAssumptionOutput(
                invalidated_findings=[],
                has_stale_assumptions=False
            )  # type: ignore

        # 7. Goal Consistency
        if response_model == GoalConsistencyOutput:
            return GoalConsistencyOutput(
                is_aligned=True,
                alignment_score=0.92,
                consistency_verdict="All negotiated compromises remain strictly aligned with the primary objective."
            )  # type: ignore

        # 8. Final Synthesis
        if response_model == SynthesisOutput:
            return self._mock_synthesis(prompt, prompt_lower)  # type: ignore

        # Fallback to schema default instantiation
        try:
            return response_model()  # type: ignore
        except Exception:
            raise NotImplementedError(f"Mock generator for schema {response_model.__name__} not implemented.")

    async def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.4
    ) -> str:
        if self.simulated_delay > 0:
            await asyncio.sleep(self.simulated_delay)
        return f"[Simulated Response] Analysis for: {prompt[:120]}..."

    async def health_check(self) -> Dict[str, Any]:
        return {
            "status": "healthy",
            "provider": "MockLLMProvider",
            "mode": "Simulation (Zero Token Cost)",
            "telemetry": {"simulated_delay": self.simulated_delay}
        }

    # -------------------------------------------------------------------------
    # Scenario & Arbitrary Decision Mock Generators
    # -------------------------------------------------------------------------

    def _mock_decomposition(self, prompt: str, p_lower: str) -> GoalDecompositionOutput:
        """Decompose any goal into domain workstreams and assign specialists."""
        if "brazil" in p_lower:
            return GoalDecompositionOutput(
                problem_statement_clarified="Strategic evaluation of launching Product Y into Brazil next quarter balancing market demand, regulatory compliance, unit economics, and competitive risk.",
                decomposed_workstreams=[
                    Workstream(
                        workstream_id="WS-01",
                        title="Consumer Demand & Market Sizing",
                        domain="Market Research",
                        required_expertise="Market Strategy Specialist",
                        tasks=[Task(task_id="TSK-MKT-01", workstream_id="WS-01", assigned_agent="MarketResearchAgent", objective="Quantify demand growth and consumer adoption velocity in Brazil")]
                    ),
                    Workstream(
                        workstream_id="WS-02",
                        title="ANATEL Certification & Compliance",
                        domain="Regulatory & Compliance",
                        required_expertise="Regulatory Compliance Specialist",
                        tasks=[Task(task_id="TSK-REG-01", workstream_id="WS-02", assigned_agent="RegulatoryComplianceAgent", objective="Identify mandatory import licenses and statutory approval timelines")]
                    ),
                    Workstream(
                        workstream_id="WS-03",
                        title="Unit Economics & Tariff Modeling",
                        domain="Financial Modeling",
                        required_expertise="Financial Modeling Specialist",
                        tasks=[Task(task_id="TSK-FIN-01", workstream_id="WS-03", assigned_agent="FinancialModelingAgent", objective="Model margin sensitivity to delays and local certification tariffs")]
                    ),
                    Workstream(
                        workstream_id="WS-04",
                        title="Competitive Window of Opportunity",
                        domain="Competitive Intelligence",
                        required_expertise="Competitive Intelligence Specialist",
                        tasks=[Task(task_id="TSK-CMP-01", workstream_id="WS-04", assigned_agent="CompetitiveIntelAgent", objective="Analyze incumbent response and risk of delayed launch")]
                    )
                ],
                activated_specialists=[
                    SpecialistProfile(agent_name="MarketResearchAgent", role_title="Market Research Specialist", domain="Market Research", system_instruction="Evaluates demand, consumer segment, and adoption speed.", color_theme="#06b6d4", avatar_icon="TrendingUp"),
                    SpecialistProfile(agent_name="RegulatoryComplianceAgent", role_title="Regulatory & Compliance Specialist", domain="Regulatory & Compliance", system_instruction="Evaluates statutory certification and legal delays.", color_theme="#f97316", avatar_icon="ShieldCheck"),
                    SpecialistProfile(agent_name="FinancialModelingAgent", role_title="Financial Modeling Specialist", domain="Financial Modeling", system_instruction="Evaluates unit economics, cash burn, and margin margins.", color_theme="#10b981", avatar_icon="DollarSign"),
                    SpecialistProfile(agent_name="CompetitiveIntelAgent", role_title="Competitive Intelligence Specialist", domain="Competitive Intelligence", system_instruction="Evaluates competitor moves and launch windows.", color_theme="#8b5cf6", avatar_icon="Crosshair")
                ],
                extracted_implicit_constraints=[
                    Constraint(constraint_id="CST-01", category="timeline", description="Target launch window is next quarter (within 12 weeks)", is_hard_constraint=False),
                    Constraint(constraint_id="CST-02", category="compliance", description="Mandatory Brazilian ANATEL/ANVISA certification before distribution", is_hard_constraint=True)
                ]
            )

        if "postgres" in p_lower or "mongodb" in p_lower or "database" in p_lower or "migrate" in p_lower:
            return GoalDecompositionOutput(
                problem_statement_clarified="Evaluation of migrating production database from MongoDB to PostgreSQL analyzing technical schema complexity, data integrity, operational downtime, and financial cost.",
                decomposed_workstreams=[
                    Workstream(
                        workstream_id="WS-01",
                        title="Data Architecture & Schema Mapping",
                        domain="Technical Architecture",
                        required_expertise="Principal Data Architect",
                        tasks=[Task(task_id="TSK-ARCH-01", workstream_id="WS-01", assigned_agent="TechnicalArchitectureAgent", objective="Assess document-to-relational schema translation and JSONB performance")]
                    ),
                    Workstream(
                        workstream_id="WS-02",
                        title="Operational Downtime & Migration Risk",
                        domain="Site Reliability Engineering",
                        required_expertise="Reliability & Migration Specialist",
                        tasks=[Task(task_id="TSK-SRE-01", workstream_id="WS-02", assigned_agent="OperationsRiskAgent", objective="Evaluate cutover strategies and SLA downtime constraints")]
                    ),
                    Workstream(
                        workstream_id="WS-03",
                        title="Licensing, Infrastructure & Migration Costs",
                        domain="Financial Modeling",
                        required_expertise="Cloud Financial Specialist",
                        tasks=[Task(task_id="TSK-FIN-01", workstream_id="WS-03", assigned_agent="FinancialModelingAgent", objective="Model managed PostgreSQL hosting vs MongoDB Atlas and engineering hours")]
                    ),
                    Workstream(
                        workstream_id="WS-04",
                        title="Data Governance & Compliance Audit",
                        domain="Security & Compliance",
                        required_expertise="Security & Compliance Specialist",
                        tasks=[Task(task_id="TSK-SEC-01", workstream_id="WS-04", assigned_agent="SecurityComplianceAgent", objective="Audit ACID transaction compliance, encryption at rest, and audit trail fidelity")]
                    )
                ],
                activated_specialists=[
                    SpecialistProfile(agent_name="TechnicalArchitectureAgent", role_title="Technical Architecture Specialist", domain="Technical Architecture", system_instruction="Evaluates schema compatibility, query latency, and indexing.", color_theme="#3b82f6", avatar_icon="Cpu"),
                    SpecialistProfile(agent_name="OperationsRiskAgent", role_title="Operations & SRE Specialist", domain="Site Reliability Engineering", system_instruction="Evaluates downtime windows and rollback feasibility.", color_theme="#ef4444", avatar_icon="Activity"),
                    SpecialistProfile(agent_name="FinancialModelingAgent", role_title="Financial Modeling Specialist", domain="Financial Modeling", system_instruction="Evaluates engineering migration cost and managed DB expenses.", color_theme="#10b981", avatar_icon="DollarSign"),
                    SpecialistProfile(agent_name="SecurityComplianceAgent", role_title="Security & Compliance Specialist", domain="Security & Compliance", system_instruction="Evaluates ACID consistency and compliance audits.", color_theme="#f59e0b", avatar_icon="Lock")
                ],
                extracted_implicit_constraints=[
                    Constraint(constraint_id="CST-01", category="operational", description="Maximum allowable production cutover downtime is 2 hours", is_hard_constraint=True, threshold_value="2 hours"),
                    Constraint(constraint_id="CST-02", category="budget", description="Engineering migration budget capped at $50,000", is_hard_constraint=False, threshold_value="$50,000")
                ]
            )

        # General-Purpose Default Decomposition for Any Arbitrary User Goal
        return GoalDecompositionOutput(
            problem_statement_clarified=f"Strategic multi-faceted decision analysis for: {prompt[:160]}",
            decomposed_workstreams=[
                Workstream(
                    workstream_id="WS-01",
                    title="Strategic Feasibility & Domain Viability",
                    domain="Strategic Domain Analysis",
                    required_expertise="Domain Feasibility Specialist",
                    tasks=[Task(task_id="TSK-STRAT-01", workstream_id="WS-01", assigned_agent="StrategicAnalysisAgent", objective="Analyze technical and operational feasibility for the objective")]
                ),
                Workstream(
                    workstream_id="WS-02",
                    title="Regulatory, Governance & Risk Audit",
                    domain="Governance & Risk",
                    required_expertise="Governance & Compliance Specialist",
                    tasks=[Task(task_id="TSK-GOV-01", workstream_id="WS-02", assigned_agent="RegulatoryComplianceAgent", objective="Audit legal compliance, policy adherence, and risk exposure")]
                ),
                Workstream(
                    workstream_id="WS-03",
                    title="Cost-Benefit & Financial Impact Modeling",
                    domain="Financial Economics",
                    required_expertise="Financial Modeling Specialist",
                    tasks=[Task(task_id="TSK-FIN-01", workstream_id="WS-03", assigned_agent="FinancialModelingAgent", objective="Model expenditure, expected ROI, and resource allocation")]
                ),
                Workstream(
                    workstream_id="WS-04",
                    title="Operational Readiness & Change Management",
                    domain="Operations & Execution",
                    required_expertise="Operational Execution Specialist",
                    tasks=[Task(task_id="TSK-OPS-01", workstream_id="WS-04", assigned_agent="OperationsRiskAgent", objective="Assess implementation timeline, friction, and staffing capabilities")]
                )
            ],
            activated_specialists=[
                SpecialistProfile(agent_name="StrategicAnalysisAgent", role_title="Strategic Analysis Specialist", domain="Strategic Domain Analysis", system_instruction="Analyzes feasibility, core upside, and strategic fit.", color_theme="#3b82f6", avatar_icon="Compass"),
                SpecialistProfile(agent_name="RegulatoryComplianceAgent", role_title="Governance & Compliance Specialist", domain="Governance & Risk", system_instruction="Audits compliance, regulatory bounds, and risk guardrails.", color_theme="#f97316", avatar_icon="ShieldCheck"),
                SpecialistProfile(agent_name="FinancialModelingAgent", role_title="Financial Modeling Specialist", domain="Financial Economics", system_instruction="Models budgets, cash burn, and financial returns.", color_theme="#10b981", avatar_icon="DollarSign"),
                SpecialistProfile(agent_name="OperationsRiskAgent", role_title="Operational Execution Specialist", domain="Operations & Execution", system_instruction="Audits operational readiness and timeline viability.", color_theme="#8b5cf6", avatar_icon="Clock")
            ],
            extracted_implicit_constraints=[
                Constraint(constraint_id="CST-01", category="risk", description="Zero tolerance for critical operational or compliance failure", is_hard_constraint=True),
                Constraint(constraint_id="CST-02", category="timeline", description="Implementation should be achievable within standard operational quarters", is_hard_constraint=False)
            ]
        )

    def _mock_finding(self, prompt: str, p_lower: str) -> SpecialistFindingOutput:
        """Generate substantive domain findings with assertions that naturally introduce trade-offs."""
        # 1. Market Research Agent
        if "market" in p_lower:
            return SpecialistFindingOutput(
                topic="Market Demand & Time-to-Market Urgency",
                claim="High consumer interest identified. Fast entry within 6 weeks is critical to capture early market share before competitors saturate the channel.",
                assertions=[
                    Assertion(dimension="timeline_weeks", dimension_label="Target Launch Window", value=6.0, unit="weeks", is_flexible=True, acceptable_range=[4.0, 8.0]),
                    Assertion(dimension="market_demand", dimension_label="Demand Confidence", value="HIGH", unit="score", is_flexible=False)
                ],
                assumptions=["No external legal roadblocks prevent direct sales by week 6", "Digital marketing campaign starts in week 2"],
                confidence=0.88,
                evidence_summary="Consumer survey index shows 74% intent to purchase. A delay beyond 8 weeks reduces early capture rate by 35%."
            )

        # 2. Regulatory & Compliance Agent
        if "regulatory" in p_lower or "compliance" in p_lower or "governance" in p_lower:
            return SpecialistFindingOutput(
                topic="Statutory Compliance & Certification Gate",
                claim="Mandatory regulatory certification requires a 10 to 12 week testing audit. Operating without certification incurs immediate statutory fines and seizure.",
                assertions=[
                    Assertion(dimension="timeline_weeks", dimension_label="Required Certification Duration", value=10.0, unit="weeks", is_flexible=False),
                    Assertion(dimension="compliance_status", dimension_label="Compliance Mandatory Gate", value=True, is_flexible=False),
                    Assertion(dimension="budget_usd", dimension_label="Statutory Audit Fees", value=25000.0, unit="USD", is_flexible=False)
                ],
                assumptions=["Regulatory body maintains standard processing queue", "Audit documents pass on first submission"],
                confidence=0.95,
                evidence_summary="Article 14 statutory codes mandate hardware testing. Average queue duration across peers is 10.4 weeks."
            )

        # 3. Financial Modeling Agent
        if "financial" in p_lower or "cost" in p_lower:
            return SpecialistFindingOutput(
                topic="Margin Sensitivity & Burn Projections",
                claim="Projected ROI remains positive with 28% gross margin, provided total certification and launch delay costs do not exceed $40,000.",
                assertions=[
                    Assertion(dimension="budget_usd", dimension_label="Max Delay Cost Threshold", value=40000.0, unit="USD", is_flexible=True, acceptable_range=[30000.0, 50000.0]),
                    Assertion(dimension="feasibility_score", dimension_label="ROI Feasibility", value=0.82, is_flexible=True)
                ],
                assumptions=["Unit production cost remains stable", "Pre-launch cash reserves can sustain 8 weeks of idle overhead"],
                confidence=0.86,
                evidence_summary="Financial break-even occurs at month 9 under base case. Every month of delay adds $12k in fixed overhead."
            )

        # 4. Competitive / Architecture / Operations
        if "competitive" in p_lower:
            return SpecialistFindingOutput(
                topic="Incumbent Positioning & Competitive Window",
                claim="Primary competitor is preparing an equivalent launch in month 4. Missing the quarter entirely surrenders first-mover positioning.",
                assertions=[
                    Assertion(dimension="risk_level", dimension_label="Competitive Preemption Risk", value="HIGH", is_flexible=False),
                    Assertion(dimension="timeline_weeks", dimension_label="Maximum Competitive Buffer", value=12.0, unit="weeks", is_flexible=True)
                ],
                assumptions=["Competitor faces the same regulatory barriers", "Early beta users show brand stickiness"],
                confidence=0.82,
                evidence_summary="Competitor hiring and patent filings indicate an active Q3 rollout."
            )

        # General Technical / Operational Fallback Finding
        return SpecialistFindingOutput(
            topic="Operational Readiness & Implementation Constraints",
            claim="Implementation requires 8 weeks of phased staging to avoid operational downtime and maintain system SLAs.",
            assertions=[
                Assertion(dimension="timeline_weeks", dimension_label="Implementation Duration", value=8.0, unit="weeks", is_flexible=True, acceptable_range=[6.0, 10.0]),
                Assertion(dimension="risk_level", dimension_label="Operational Disruption Risk", value="MEDIUM", is_flexible=False)
            ],
            assumptions=["Existing infrastructure remains healthy", "Staff allocation remains dedicated"],
            confidence=0.85,
            evidence_summary="Standard operational staging lifecycle across comparable organizational transformations."
        )

    def _mock_conflict_detection(self, prompt: str, p_lower: str) -> ConflictDetectionOutput:
        """Detect realistic multi-agent clashes."""
        return ConflictDetectionOutput(
            has_conflicts=True,
            cross_agent_compatibility_score=0.45,
            summary_of_tensions="Severe timeline friction detected between Market/Business urgency (wants launch in 6 weeks) and Regulatory/Operational mandate (requires 10-12 weeks mandatory testing).",
            conflicts_detected=[
                DetectedConflictItem(
                    agents_involved=["MarketResearchAgent", "RegulatoryComplianceAgent"],
                    conflict_type="timeline_mismatch",
                    description="Market Agent demands market launch in 6 weeks to secure early-mover advantage, but Regulatory Agent asserts certification requires 10 weeks and cannot be bypassed.",
                    severity="critical",
                    incompatible_claims=[
                        "Market Agent: Target launch window is 6 weeks (acceptable max: 8 weeks)",
                        "Regulatory Agent: Mandatory certification timeline is 10 weeks (non-negotiable hard constraint)"
                    ]
                )
            ]
        )

    def _mock_negotiation_proposal(self, prompt: str, p_lower: str) -> NegotiationProposalOutput:
        """Formulate constructive concessions."""
        if "market" in p_lower:
            return NegotiationProposalOutput(
                proposing_agent="MarketResearchAgent",
                compromise_statement="Propose a two-stage rollout: Run an exclusive digital pre-order / waitlist campaign in week 6 to capture demand, and shift physical general availability to week 11 upon certification completion.",
                concessions_made=["Conceding physical delivery date from week 6 to week 11", "Replacing direct sales in month 1 with VIP waitlist reservation"],
                impact_on_domain="Preserves 85% of initial consumer excitement and locks in early customer commitments without violating import laws."
            )
        return NegotiationProposalOutput(
            proposing_agent="RegulatoryComplianceAgent",
            compromise_statement="Accept marketing and digital pre-registration in week 6 provided zero commercial units cross customs or enter user hands before the week 10 certificate is issued.",
            concessions_made=["Clarified that pre-marketing and waitlist signups do not trigger regulatory enforcement"],
            impact_on_domain="Maintains 100% legal compliance with zero risk of statutory fines or equipment seizure."
        )

    def _mock_negotiation_moderation(self, prompt: str, p_lower: str) -> NegotiationModerationOutput:
        """Synthesize agreed compromise."""
        return NegotiationModerationOutput(
            compromise_achieved=True,
            synthesis_statement="Agreement reached on Phased Dual-Track Rollout: Launch digital brand awareness, developer beta, and VIP waitlist in Week 6; execute physical commercial launch in Week 11 immediately upon receipt of formal certification.",
            revised_findings=[
                RevisedFindingItem(
                    finding_id="FND-MKT-001",
                    revised_claim="Phased demand capture: VIP Waitlist & Soft Campaign in Week 6, full commercial release in Week 11.",
                    revised_assertions=[
                        Assertion(dimension="timeline_weeks", dimension_label="Soft Launch Window", value=6.0, unit="weeks", is_flexible=False),
                        Assertion(dimension="timeline_weeks", dimension_label="Commercial Launch Window", value=11.0, unit="weeks", is_flexible=False)
                    ]
                )
            ],
            unresolved_issues=[]
        )

    def _mock_synthesis(self, prompt: str, p_lower: str) -> SynthesisOutput:
        """Synthesize unified strategic recommendation with fine-grained attribution."""
        if "postgres" in p_lower or "mongodb" in p_lower or "database" in p_lower or "migrate" in p_lower:
            return SynthesisOutput(
                executive_summary="CollaborAI multi-agent deliberation concluded that database migration to PostgreSQL is viable and recommended under a dual-write CDC phased migration pattern. This eliminates the 2-hour downtime constraint violation, maintains ACID compliance, and preserves the $50k engineering budget.",
                strategic_verdict="GO_WITH_CONDITIONS",
                phased_roadmap=[
                    {
                        "phase": "Phase 1: Relational Schema DDL & CDC Pipeline",
                        "duration": "Weeks 1 - 3",
                        "actions": ["Deploy Debezium CDC pipeline", "Map document collections to relational tables", "Verify JSONB fallback columns"],
                        "owner": "Technical Architecture & Security"
                    },
                    {
                        "phase": "Phase 2: Shadow Dual-Write & Reconciliation",
                        "duration": "Weeks 4 - 6",
                        "actions": ["Shadow traffic dual-writes", "Automated parity auditing", "Performance load testing"],
                        "owner": "Operations & SRE"
                    },
                    {
                        "phase": "Phase 3: Production Cutover (< 5 min failover)",
                        "duration": "Week 7",
                        "actions": ["Promote PostgreSQL to primary", "Switch read replicas", "Decommission MongoDB cluster"],
                        "owner": "All Workstreams"
                    }
                ],
                risk_mitigation_plan=[
                    {
                        "risk": "Data drift during dual-write transition",
                        "severity": "Medium",
                        "mitigation": "Continuous checksum validator script comparing primary keys across clusters.",
                        "monitoring": "Alerting on CDC lag > 500ms."
                    }
                ],
                attributed_claims=[
                    ClaimAttributionItem(
                        statement="Dual-write CDC replication pattern compresses production cutover downtime to under 5 minutes, satisfying the strict 2-hour SLA constraint.",
                        contributing_agents=["TechnicalArchitectureAgent", "OperationsRiskAgent"],
                        rationale="Synthesized from architecture schema review and operations staging models.",
                        confidence=0.95
                    ),
                    ClaimAttributionItem(
                        statement="Total engineering migration hours and managed RDS hosting stay within the $50,000 budget cap.",
                        contributing_agents=["FinancialModelingAgent"],
                        rationale="Financial burn projections confirm positive ROI within 6 months.",
                        confidence=0.91
                    ),
                    ClaimAttributionItem(
                        statement="ACID transaction integrity and encryption-at-rest requirements are fully satisfied by PostgreSQL native engines.",
                        contributing_agents=["SecurityComplianceAgent"],
                        rationale="Security audit confirms compliance with data sovereignty protocols.",
                        confidence=0.94
                    )
                ]
            )

        return SynthesisOutput(
            executive_summary="CollaborAI multi-agent deliberation concluded with a clear conditional green light. By reconciling market timing urgency with mandatory 10-week regulatory certification through a phased dual-track rollout, the organization protects first-mover demand while guaranteeing zero regulatory penalties and maintaining a 26% operating margin.",
            strategic_verdict="GO_WITH_CONDITIONS",
            phased_roadmap=[
                {
                    "phase": "Phase 1: Compliance Fast-Track & Filing",
                    "duration": "Weeks 1 - 4",
                    "actions": ["Submit formal certification dossier", "Engage local regulatory counsel", "Lock BOM tariffs"],
                    "owner": "Regulatory & Financial Agents"
                },
                {
                    "phase": "Phase 2: Digital Soft-Launch & Waitlist",
                    "duration": "Weeks 5 - 9",
                    "actions": ["Launch VIP waitlist and influencer previews", "Benchmark competitor pricing", "Pre-qualify B2B buyers"],
                    "owner": "Market & Competitive Agents"
                },
                {
                    "phase": "Phase 3: Formal Commercial GA Launch",
                    "duration": "Weeks 10 - 12",
                    "actions": ["Finalize certificate clearance", "Begin customs dispatch", "Scale national advertising"],
                    "owner": "All Workstreams"
                }
            ],
            risk_mitigation_plan=[
                {
                    "risk": "Regulatory backlog extending past 10 weeks",
                    "severity": "Medium",
                    "mitigation": "Retain secondary accredited testing lab on standby with $8k contingency retainer.",
                    "monitoring": "Weekly audit status check with ministry liaison."
                },
                {
                    "risk": "Competitor counter-campaign during waitlist window",
                    "severity": "Low",
                    "mitigation": "Offer early-adopter price guarantee and exclusive local localized bundle.",
                    "monitoring": "Daily competitor ad spend scraping."
                }
            ],
            attributed_claims=[
                ClaimAttributionItem(
                    statement="Mandatory statutory certification lead time is established at 10 weeks, prohibiting premature physical rollout before week 10.",
                    contributing_agents=["RegulatoryComplianceAgent"],
                    rationale="Derived from statutory testing mandates identified in FND-REG-001.",
                    confidence=0.96
                ),
                ClaimAttributionItem(
                    statement="Consumer demand remains highly receptive, warranting pre-launch waitlist activities in Week 6.",
                    contributing_agents=["MarketResearchAgent"],
                    rationale="Supported by 74% consumer purchase intent index in FND-MKT-001.",
                    confidence=0.88
                ),
                ClaimAttributionItem(
                    statement="Phased dual-track rollout eliminates compliance penalty risks while capturing 85% of early market demand.",
                    contributing_agents=["MarketResearchAgent", "RegulatoryComplianceAgent", "Negotiation Moderator"],
                    rationale="Direct result of Round 1 negotiation concession compromise DEC-NEG-001.",
                    confidence=0.93
                ),
                ClaimAttributionItem(
                    statement="Gross margin remains resilient at 26%, safely within financial feasibility thresholds.",
                    contributing_agents=["FinancialModelingAgent"],
                    rationale="Financial sensitivity analysis in FND-FIN-001 confirms viable ROI under a 4-week marketing shift.",
                    confidence=0.89
                )
            ]
        )

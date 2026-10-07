"""General-Purpose State Machine & Coordination Graph for CollaborAI.

Implements an explicit cyclic state machine executing the PS-27 lifecycle:
Goal -> Decompose -> Activate Specialists -> Parallel Execution ->
Blackboard Sharing -> Conflict Detection -> Negotiation Loop ->
Stale Assumption Check -> Human Escalation (if deadlocked) ->
Goal Consistency -> Unified Synthesis & Attribution.
"""

from __future__ import annotations
import asyncio
import logging
import uuid
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional

from ..schemas.state import (
    SharedState,
    Finding,
    Assertion,
    Conflict,
    NegotiationRound,
    NegotiationProposal,
    StaleAssumption,
    HumanEscalation,
    EscalationOption,
    FinalRecommendation,
    AttributedClaim,
    AgentStatus,
    ExecutionEvent,
    SpecialistProfile
)
from ..schemas.agent_io import (
    GoalDecompositionOutput,
    SpecialistFindingOutput,
    ConflictDetectionOutput,
    NegotiationProposalOutput,
    NegotiationModerationOutput,
    SynthesisOutput
)
from ..agents.registry import agent_registry
from ..llm import BaseLLMProvider, get_llm_provider

logger = logging.getLogger("collaborai.orchestration.graph")


class CoordinationStateGraph:
    """Explicit cyclic multi-agent coordination state machine."""

    def __init__(self, llm_provider: Optional[BaseLLMProvider] = None):
        self.llm = llm_provider or get_llm_provider()

    # -------------------------------------------------------------------------
    # Node 1: Goal Decomposition
    # -------------------------------------------------------------------------
    async def decompose_goal_node(
        self,
        state: SharedState,
        event_callback: Optional[Callable[[ExecutionEvent], None]] = None
    ) -> SharedState:
        """Analyze goal, extract constraints, and dynamically activate specialists."""
        logger.info("Executing decompose_goal_node for run %s", state.run_id)

        prompt = f"""
You are the Lead Goal Decomposition & Coordination Orchestrator.
Analyze the following high-level user decision goal and constraints:

USER GOAL:
"{state.goal}"

CONSTRAINTS:
{[c.model_dump() for c in state.constraints]}

INSTRUCTIONS:
1. Clarify the core decision problem statement.
2. Decompose this goal into 3-4 interdependent domain workstreams.
3. For each workstream, define the required specialist expertise (e.g. Market, Regulatory, Financial, Technical Architecture, Security, Operations, etc.).
4. Extract any implicit constraints from the goal.
"""
        decomp_output: GoalDecompositionOutput = await self.llm.generate_structured(
            prompt=prompt,
            response_model=GoalDecompositionOutput,
            system_instruction="You are a Master Strategic Orchestrator specializing in complex multi-domain decision intelligence."
        )

        state.workstreams = decomp_output.decomposed_workstreams
        for c in decomp_output.extracted_implicit_constraints:
            if not any(existing.description == c.description for existing in state.constraints):
                state.constraints.append(c)

        # Resolve specialists using dynamic Agent Registry
        activated_profiles: List[SpecialistProfile] = []
        for ws in state.workstreams:
            for task in ws.tasks:
                state.tasks.append(task)
                profile = agent_registry.resolve_specialist(task.assigned_agent, domain_hint=ws.domain)
                if not any(p.agent_name == profile.agent_name for p in activated_profiles):
                    activated_profiles.append(profile)

        state.active_specialists = activated_profiles

        # Initialize agent statuses
        for spec in activated_profiles:
            state.agent_statuses[spec.agent_name] = AgentStatus(
                agent_name=spec.agent_name,
                role=spec.role_title,
                state="idle",
                last_action="Workstream assigned",
                color_theme=spec.color_theme,
                avatar_icon=spec.avatar_icon
            )

        # Emit event
        event = ExecutionEvent(
            event_id=f"EVT-{uuid.uuid4().hex[:8]}",
            run_id=state.run_id,
            event_type="WORKSTREAMS_DECOMPOSED",
            title="Goal Decomposed & Specialist Team Activated",
            data={
                "workstreams_count": len(state.workstreams),
                "tasks_count": len(state.tasks),
                "specialists": [s.agent_name for s in activated_profiles],
                "specialists_profiles": [s.model_dump() for s in activated_profiles],
                "tasks": [t.model_dump() for t in state.tasks],
                "workstreams": [w.model_dump() for w in state.workstreams]
            }
        )
        state.execution_events.append(event)
        if event_callback:
            event_callback(event)

        return state

    # -------------------------------------------------------------------------
    # Node 2: Specialist Execution Tier
    # -------------------------------------------------------------------------
    async def execute_specialists_node(
        self,
        state: SharedState,
        event_callback: Optional[Callable[[ExecutionEvent], None]] = None
    ) -> SharedState:
        """Run specialist agents to post findings with quantitative assertions."""
        logger.info("Executing specialists node for run %s", state.run_id)

        for i, specialist in enumerate(state.active_specialists):
            # Update status to thinking
            state.agent_statuses[specialist.agent_name].state = "thinking"
            state.agent_statuses[specialist.agent_name].last_action = "Analyzing assigned domain workstream"

            status_event = ExecutionEvent(
                event_id=f"EVT-{uuid.uuid4().hex[:8]}",
                run_id=state.run_id,
                event_type="AGENT_STATUS_UPDATED",
                agent_name=specialist.agent_name,
                title=f"{specialist.role_title} is analyzing...",
                data={"status": "thinking"}
            )
            state.execution_events.append(status_event)
            if event_callback:
                event_callback(status_event)

            # Stagger specialist execution slightly (1.0s) to keep Free Tier traffic smooth
            if i > 0:
                await asyncio.sleep(1.0)

            # Build prompt with shared blackboard visibility
            blackboard_context = "\n".join(
                f"- [From {f.agent_name} ({f.topic})]: {f.claim} (Confidence: {f.confidence})"
                for f in state.findings if f.status == "active"
            ) or "Blackboard is currently empty."

            prompt = f"""
You are the {specialist.role_title} ({specialist.domain}).
System Persona: {specialist.system_instruction}

PRIMARY GOAL: "{state.goal}"
CONSTRAINTS: {[c.description for c in state.constraints]}

SHARED BLACKBOARD (PEER FINDINGS):
{blackboard_context}

YOUR MANDATE:
Deliver your independent domain findings. Provide:
1. Core substantive claim.
2. Quantifiable assertions (e.g. timeline_weeks, budget_usd, compliance_status, risk_level, feasibility_score).
3. Explicit assumptions you are making.
4. Confidence score (0.0 - 1.0).
5. Evidence summary.
"""
            finding_output: SpecialistFindingOutput = await self.llm.generate_structured(
                prompt=prompt,
                response_model=SpecialistFindingOutput,
                system_instruction=specialist.system_instruction
            )

            # Register finding
            finding_id = f"FND-{specialist.agent_name[:3].upper()}-{len(state.findings) + 1:03d}"
            finding = Finding(
                finding_id=finding_id,
                run_id=state.run_id,
                agent_name=specialist.agent_name,
                topic=finding_output.topic,
                claim=finding_output.claim,
                assertions=finding_output.assertions,
                assumptions=finding_output.assumptions,
                confidence=finding_output.confidence,
                evidence={"summary": finding_output.evidence_summary},
                dependencies=finding_output.dependencies_on_peers,
                status="active"
            )
            state.findings.append(finding)

            state.agent_statuses[specialist.agent_name].state = "posting_finding"
            state.agent_statuses[specialist.agent_name].last_action = f"Posted finding {finding_id}"

            finding_event = ExecutionEvent(
                event_id=f"EVT-{uuid.uuid4().hex[:8]}",
                run_id=state.run_id,
                event_type="FINDING_POSTED",
                agent_name=specialist.agent_name,
                title=f"{specialist.role_title} posted finding: {finding.topic}",
                data=finding.model_dump()
            )
            state.execution_events.append(finding_event)
            if event_callback:
                event_callback(finding_event)

        return state

    # -------------------------------------------------------------------------
    # Node 3: Conflict Detection
    # -------------------------------------------------------------------------
    async def detect_conflicts_node(
        self,
        state: SharedState,
        event_callback: Optional[Callable[[ExecutionEvent], None]] = None
    ) -> SharedState:
        """Cross-audit all active findings on the blackboard to detect clashes."""
        logger.info("Executing conflict detection node for run %s", state.run_id)

        active_findings = [f for f in state.findings if f.status == "active"]
        if len(active_findings) < 2:
            return state

        findings_summary = "\n".join(
            f"[{f.finding_id}] Agent: {f.agent_name}\n"
            f"  Topic: {f.topic}\n"
            f"  Claim: {f.claim}\n"
            f"  Assertions: {[a.model_dump() for a in f.assertions]}\n"
            f"  Assumptions: {f.assumptions}"
            for f in active_findings
        )

        prompt = f"""
You are the Multi-Agent Conflict Detection Engine.
Evaluate the following active findings posted to the shared blackboard for incompatible claims, timeline mismatches, budget breaches, or risk appetite tensions:

GOAL: "{state.goal}"
CONSTRAINTS: {[c.description for c in state.constraints]}

ACTIVE FINDINGS:
{findings_summary}

INSTRUCTIONS:
1. Check for dimensional clashes (e.g., timeline requirement vs certification delay, budget limit vs projected costs).
2. Check for semantic trade-offs (e.g. speed to market vs compliance penalty risk).
3. If conflicts exist, return them with severity and involved agent names.
"""
        detection_output: ConflictDetectionOutput = await self.llm.generate_structured(
            prompt=prompt,
            response_model=ConflictDetectionOutput,
            system_instruction="You are an unbiased analytical auditor detecting contradictions across specialized AI agents."
        )

        if detection_output.has_conflicts and detection_output.conflicts_detected:
            for item in detection_output.conflicts_detected:
                # Find matching finding IDs
                clashing_ids = [
                    f.finding_id for f in active_findings
                    if f.agent_name in item.agents_involved
                ]
                conflict = Conflict(
                    conflict_id=f"CNF-{len(state.conflicts) + 1:03d}",
                    run_id=state.run_id,
                    agents_involved=item.agents_involved,
                    incompatible_finding_ids=clashing_ids,
                    conflict_type=item.conflict_type,
                    description=item.description,
                    severity=item.severity,
                    status="detected"
                )
                state.conflicts.append(conflict)

                # Update agent states to debating
                for agent_name in item.agents_involved:
                    if agent_name in state.agent_statuses:
                        state.agent_statuses[agent_name].state = "debating"
                        state.agent_statuses[agent_name].last_action = f"Engaged in conflict {conflict.conflict_id}"

                conflict_event = ExecutionEvent(
                    event_id=f"EVT-{uuid.uuid4().hex[:8]}",
                    run_id=state.run_id,
                    event_type="CONFLICT_DETECTED",
                    title=f"Conflict Detected: {conflict.conflict_type}",
                    data=conflict.model_dump()
                )
                state.execution_events.append(conflict_event)
                if event_callback:
                    event_callback(conflict_event)

        return state

    # -------------------------------------------------------------------------
    # Node 4: Negotiation Engine
    # -------------------------------------------------------------------------
    async def negotiate_conflicts_node(
        self,
        state: SharedState,
        event_callback: Optional[Callable[[ExecutionEvent], None]] = None
    ) -> SharedState:
        """Conduct structured multi-round negotiation between conflicting specialists."""
        logger.info("Executing negotiation node for run %s", state.run_id)

        unresolved_conflicts = [c for c in state.conflicts if c.status in ["detected", "negotiating"]]
        if not unresolved_conflicts:
            return state

        for conflict in unresolved_conflicts:
            round_number = len([r for r in state.negotiations if r.conflict_id == conflict.conflict_id]) + 1
            conflict.status = "negotiating"

            round_record = NegotiationRound(
                round_id=f"NEG-{conflict.conflict_id}-R{round_number}",
                conflict_id=conflict.conflict_id,
                round_number=round_number
            )

            # Round 1 or 2: Solicit concessions from conflicting agents
            for agent_name in conflict.agents_involved:
                opposing_agents = [a for a in conflict.agents_involved if a != agent_name]
                proposal_prompt = f"""
You are {agent_name}. You are in a direct tension with {opposing_agents}.
CONFLICT DESCRIPTION: "{conflict.description}"

What trade-off, concession, or phased compromise are you willing to propose to resolve this tension
without abandoning your primary professional standards?
"""
                proposal_out: NegotiationProposalOutput = await self.llm.generate_structured(
                    prompt=proposal_prompt,
                    response_model=NegotiationProposalOutput,
                    system_instruction=f"You are {agent_name} negotiating a high-stakes trade-off with peers."
                )

                proposal = NegotiationProposal(
                    proposal_id=f"PROP-{uuid.uuid4().hex[:6]}",
                    proposing_agent=agent_name,
                    round_number=round_number,
                    compromise_statement=proposal_out.compromise_statement,
                    concessions_made=proposal_out.concessions_made,
                    impact_on_own_domain=proposal_out.impact_on_domain
                )
                round_record.proposals.append(proposal)

            # Synthesize moderation compromise
            moderation_prompt = f"""
You are the Negotiation Moderator.
Evaluate the concessions offered by the conflicting agents:

CONFLICT: {conflict.description}
OFFERS:
{[p.model_dump() for p in round_record.proposals]}

Can these concessions be synthesized into a mutually viable compromise (e.g. phased rollout, soft launch, dual-track staging)?
CRITICAL RULE: If the tension involves strictly irreconcilable HARD constraints (e.g. statutory moratoriums, non-negotiable legal liability, or strict zero-compromise mandates where no concession is legally or operationally viable), you MUST set compromise_achieved to false and summarize why executive human escalation is required.
Otherwise, set compromise_achieved to true and provide the synthesized compromise statement and revised findings.
"""
            mod_output: NegotiationModerationOutput = await self.llm.generate_structured(
                prompt=moderation_prompt,
                response_model=NegotiationModerationOutput,
                system_instruction="You are a Master Mediator crafting optimal compromise Pareto frontiers."
            )

            round_record.compromise_achieved = mod_output.compromise_achieved
            round_record.synthesis_statement = mod_output.synthesis_statement
            state.negotiations.append(round_record)

            if mod_output.compromise_achieved:
                conflict.status = "resolved"
                conflict.resolution_summary = mod_output.synthesis_statement

                # Apply revisions to findings
                for rev in mod_output.revised_findings:
                    for f in state.findings:
                        if f.finding_id == rev.finding_id:
                            f.claim = rev.revised_claim
                            if rev.revised_assertions:
                                f.assertions = rev.revised_assertions
                            f.status = "revised"
                            f.revised_at = datetime.utcnow()

                for agent_name in conflict.agents_involved:
                    if agent_name in state.agent_statuses:
                        state.agent_statuses[agent_name].state = "resolved"
                        state.agent_statuses[agent_name].last_action = "Compromise accepted"

                resolved_event = ExecutionEvent(
                    event_id=f"EVT-{uuid.uuid4().hex[:8]}",
                    run_id=state.run_id,
                    event_type="NEGOTIATION_RESOLVED",
                    title=f"Conflict {conflict.conflict_id} Resolved via Negotiation",
                    data=round_record.model_dump()
                )
                state.execution_events.append(resolved_event)
                if event_callback:
                    event_callback(resolved_event)
            else:
                # Deadlock reached -> Escalate to human
                conflict.status = "escalated"
                await self._trigger_human_escalation(state, conflict, event_callback)

        return state

    # -------------------------------------------------------------------------
    # Node 5: Human Escalation Trigger
    # -------------------------------------------------------------------------
    async def _trigger_human_escalation(
        self,
        state: SharedState,
        conflict: Conflict,
        event_callback: Optional[Callable[[ExecutionEvent], None]] = None
    ) -> None:
        """Construct escalation ticket and pause execution for human input."""
        logger.info("Triggering human escalation for conflict %s", conflict.conflict_id)

        escalation = HumanEscalation(
            escalation_id=f"ESC-{len(state.escalations) + 1:03d}",
            run_id=state.run_id,
            conflict_id=conflict.conflict_id,
            reason=f"Agents {conflict.agents_involved} deadlocked after {state.max_negotiation_rounds} rounds of negotiation.",
            options=[
                EscalationOption(
                    option_id="OPT-A",
                    title="Strict Compliance / Safety First",
                    description="Delay timeline to satisfy all statutory and compliance gates.",
                    trade_offs=["Delay time-to-market", "Allow competitors early positioning"],
                    estimated_impact="Zero legal liability, preserved operational integrity"
                ),
                EscalationOption(
                    option_id="OPT-B",
                    title="Fast-Track Expedited Investment",
                    description="Allocate emergency budget (+30%) to compress certification lead times.",
                    trade_offs=["Higher initial capital expenditure", "Margin dilution"],
                    estimated_impact="Launches 3-4 weeks earlier while preserving compliance"
                ),
                EscalationOption(
                    option_id="OPT-C",
                    title="Alternative Market / Architecture Pivot",
                    description="Pivot immediate rollout to secondary market or hybrid architecture with zero delay.",
                    trade_offs=["Secondary market yields 25% lower initial revenue"],
                    estimated_impact="Immediate launch with instant cashflow"
                )
            ]
        )
        state.escalations.append(escalation)
        state.is_paused_for_human = True

        for agent_name in conflict.agents_involved:
            if agent_name in state.agent_statuses:
                state.agent_statuses[agent_name].state = "waiting_human"
                state.agent_statuses[agent_name].last_action = "Awaiting executive human decision"

        esc_event = ExecutionEvent(
            event_id=f"EVT-{uuid.uuid4().hex[:8]}",
            run_id=state.run_id,
            event_type="HUMAN_ESCALATION_TRIGGERED",
            title="Human Escalation Required: Multi-Agent Deadlock",
            data=escalation.model_dump()
        )
        state.execution_events.append(esc_event)
        if event_callback:
            event_callback(esc_event)

    # -------------------------------------------------------------------------
    # Node 4.5: Stale Assumption Detection
    # -------------------------------------------------------------------------
    async def stale_assumption_check_node(
        self,
        state: SharedState,
        event_callback: Optional[Callable[[ExecutionEvent], None]] = None
    ) -> SharedState:
        """Cross-check each finding's assumptions against all peer findings.

        If a newer finding invalidates a predecessor's premise, flag it as stale
        and trigger a re-evaluation of the affected specialist.
        """
        logger.info("Executing stale assumption check for run %s", state.run_id)

        active_findings = [f for f in state.findings if f.status in ("active", "revised")]
        if len(active_findings) < 2:
            return state

        findings_summary = "\n".join(
            f"[{f.finding_id}] Agent: {f.agent_name}\n"
            f"  Claim: {f.claim}\n"
            f"  Assumptions: {f.assumptions}\n"
            f"  Assertions: {[a.model_dump() for a in f.assertions]}"
            for f in active_findings
        )

        prompt = f"""
You are the Stale Assumption Detection Engine.
Cross-audit each specialist finding's assumptions against all peer findings on the shared blackboard.

GOAL: "{state.goal}"

ACTIVE FINDINGS:
{findings_summary}

INSTRUCTIONS:
1. For each finding, check whether its explicit assumptions are contradicted or invalidated by assertions from OTHER agents' findings.
2. Example: If Agent A assumes "no regulatory delay" but Agent B asserts "10-week mandatory certification", Agent A's assumption is stale.
3. Return a list of invalidated findings with the reason and impacted agent.
4. Only flag genuinely invalidated assumptions — do NOT flag merely different perspectives.
"""
        from ..schemas.agent_io import StaleAssumptionOutput

        stale_output: StaleAssumptionOutput = await self.llm.generate_structured(
            prompt=prompt,
            response_model=StaleAssumptionOutput,
            system_instruction="You are an impartial assumption auditor detecting stale premises across specialist agents."
        )

        if stale_output.has_stale_assumptions and stale_output.invalidated_findings:
            for item in stale_output.invalidated_findings:
                # Find the affected finding
                affected = next(
                    (f for f in state.findings if f.finding_id == item.finding_id),
                    None
                )
                if not affected:
                    # Try fuzzy match on agent name
                    affected = next(
                        (f for f in state.findings
                         if item.impacted_agent.lower() in f.agent_name.lower()
                         or f.agent_name.lower() in item.impacted_agent.lower()),
                        None
                    )

                if affected:
                    # Mark finding as stale
                    affected.status = "stale"

                    stale_record = StaleAssumption(
                        assumption_id=f"STL-{len(state.stale_assumptions) + 1:03d}",
                        finding_id=affected.finding_id,
                        invalidating_finding_id=item.finding_id,
                        reason=item.invalidating_reason,
                        impacted_agent=affected.agent_name,
                        re_evaluation_required=True,
                        resolved=False
                    )
                    state.stale_assumptions.append(stale_record)

                    # Update agent status
                    if affected.agent_name in state.agent_statuses:
                        state.agent_statuses[affected.agent_name].state = "re_evaluating"
                        state.agent_statuses[affected.agent_name].last_action = (
                            f"Assumption invalidated: {item.invalidating_reason[:80]}"
                        )

                    stale_event = ExecutionEvent(
                        event_id=f"EVT-{uuid.uuid4().hex[:8]}",
                        run_id=state.run_id,
                        event_type="STALE_ASSUMPTION_FLAGGED",
                        agent_name=affected.agent_name,
                        title=f"Stale Assumption: {affected.agent_name}'s finding invalidated",
                        data=stale_record.model_dump()
                    )
                    state.execution_events.append(stale_event)
                    if event_callback:
                        event_callback(stale_event)

            # Re-evaluate affected specialists with updated blackboard context
            stale_agents = list({
                sa.impacted_agent for sa in state.stale_assumptions
                if sa.re_evaluation_required and not sa.resolved
            })
            for agent_name in stale_agents:
                specialist = next(
                    (s for s in state.active_specialists if s.agent_name == agent_name),
                    None
                )
                if not specialist:
                    continue

                blackboard_context = "\n".join(
                    f"- [{f.finding_id}] {f.agent_name}: {f.claim} (Status: {f.status})"
                    for f in state.findings
                )

                re_eval_prompt = f"""
You are {specialist.role_title} ({specialist.domain}).
Your previous finding was flagged as STALE because one or more of your assumptions
were invalidated by peer findings on the shared blackboard.

CURRENT BLACKBOARD STATE:
{blackboard_context}

INVALIDATION REASONS:
{[sa.reason for sa in state.stale_assumptions if sa.impacted_agent == agent_name]}

Re-evaluate your domain analysis with the corrected assumptions.
Provide updated claim, assertions, and confidence.
"""
                from ..schemas.agent_io import SpecialistFindingOutput

                re_eval_output: SpecialistFindingOutput = await self.llm.generate_structured(
                    prompt=re_eval_prompt,
                    response_model=SpecialistFindingOutput,
                    system_instruction=specialist.system_instruction
                )

                # Register updated finding
                new_finding_id = f"FND-{agent_name[:3].upper()}-{len(state.findings) + 1:03d}"
                new_finding = Finding(
                    finding_id=new_finding_id,
                    run_id=state.run_id,
                    agent_name=agent_name,
                    topic=re_eval_output.topic,
                    claim=re_eval_output.claim,
                    assertions=re_eval_output.assertions,
                    assumptions=re_eval_output.assumptions,
                    confidence=re_eval_output.confidence,
                    evidence={"summary": re_eval_output.evidence_summary},
                    dependencies=re_eval_output.dependencies_on_peers,
                    status="active"
                )
                state.findings.append(new_finding)

                # Mark stale assumptions as resolved
                for sa in state.stale_assumptions:
                    if sa.impacted_agent == agent_name:
                        sa.resolved = True

                if agent_name in state.agent_statuses:
                    state.agent_statuses[agent_name].state = "posting_finding"
                    state.agent_statuses[agent_name].last_action = f"Re-evaluated: posted {new_finding_id}"

                re_eval_event = ExecutionEvent(
                    event_id=f"EVT-{uuid.uuid4().hex[:8]}",
                    run_id=state.run_id,
                    event_type="FINDING_POSTED",
                    agent_name=agent_name,
                    title=f"{specialist.role_title} re-evaluated after stale assumption",
                    data=new_finding.model_dump()
                )
                state.execution_events.append(re_eval_event)
                if event_callback:
                    event_callback(re_eval_event)

        return state

    # -------------------------------------------------------------------------
    # Node 5.5: Goal Consistency Check
    # -------------------------------------------------------------------------
    async def goal_consistency_node(
        self,
        state: SharedState,
        event_callback: Optional[Callable[[ExecutionEvent], None]] = None
    ) -> SharedState:
        """Verify that all negotiated outcomes still satisfy the original goal.

        Detects goal drift where compromises may have silently abandoned core
        objectives.
        """
        logger.info("Executing goal consistency check for run %s", state.run_id)

        findings_summary = "\n".join(
            f"[{f.finding_id}] {f.agent_name}: {f.claim} (Status: {f.status})"
            for f in state.findings
        )
        resolutions_summary = "\n".join(
            f"- Conflict {c.conflict_id}: {c.resolution_summary or c.status}"
            for c in state.conflicts
        ) or "No conflicts."

        prompt = f"""
You are the Goal Consistency Auditor.
Verify that the current negotiated state of the multi-agent deliberation
still faithfully serves the user's original decision goal.

ORIGINAL GOAL: "{state.goal}"
ORIGINAL CONSTRAINTS: {[c.description for c in state.constraints]}

CURRENT BLACKBOARD FINDINGS:
{findings_summary}

CONFLICT RESOLUTIONS:
{resolutions_summary}

INSTRUCTIONS:
1. Check whether any negotiated compromise has silently abandoned a core objective.
2. Check whether constraint violations have been introduced by compromises.
3. Provide an alignment score (0.0-1.0) and verdict.
4. If misaligned, explain what drifted and which agents need correction.
"""
        from ..schemas.agent_io import GoalConsistencyOutput

        consistency_output: GoalConsistencyOutput = await self.llm.generate_structured(
            prompt=prompt,
            response_model=GoalConsistencyOutput,
            system_instruction="You are an impartial goal alignment auditor ensuring multi-agent outputs remain faithful to the user's intent."
        )

        consistency_event = ExecutionEvent(
            event_id=f"EVT-{uuid.uuid4().hex[:8]}",
            run_id=state.run_id,
            event_type="GOAL_CONSISTENCY_CHECKED",
            title=f"Goal Alignment: {'✓ Aligned' if consistency_output.is_aligned else '⚠ Drift Detected'} ({consistency_output.alignment_score:.0%})",
            data={
                "is_aligned": consistency_output.is_aligned,
                "alignment_score": consistency_output.alignment_score,
                "verdict": consistency_output.consistency_verdict,
                "divergence_notes": consistency_output.divergence_notes
            }
        )
        state.execution_events.append(consistency_event)
        if event_callback:
            event_callback(consistency_event)

        return state

    # -------------------------------------------------------------------------
    # Node 6: Final Synthesis & Attribution
    # -------------------------------------------------------------------------
    async def synthesis_node(
        self,
        state: SharedState,
        event_callback: Optional[Callable[[ExecutionEvent], None]] = None
    ) -> SharedState:
        """Synthesize unified strategic recommendation with fine-grained claim attribution."""
        logger.info("Executing final synthesis node for run %s", state.run_id)

        findings_summary = "\n".join(
            f"[{f.finding_id}] {f.agent_name}: {f.claim} (Status: {f.status})"
            for f in state.findings
        )
        resolutions_summary = "\n".join(
            f"- Conflict {c.conflict_id} ({c.conflict_type}): {c.resolution_summary or c.status}"
            for c in state.conflicts
        ) or "No conflicts encountered."

        prompt = f"""
You are the Executive Synthesis & Decision Intelligence Agent.
Synthesize the complete multi-agent deliberation into ONE actionable executive recommendation:

GOAL: "{state.goal}"
CONSTRAINTS: {[c.description for c in state.constraints]}

BLACKBOARD FINDINGS:
{findings_summary}

NEGOTIATION RESOLUTIONS:
{resolutions_summary}

INSTRUCTIONS:
1. Provide an executive summary and strategic verdict (GO, GO_WITH_CONDITIONS, DEFER, NO_GO, ALTERNATIVE_SELECTED).
2. Outline a phased implementation roadmap with durations and owners.
3. Formulate a risk mitigation matrix.
4. Provide granular attributed claims: every key recommendation statement must cite the exact contributing agents and findings!
"""
        synthesis_output: SynthesisOutput = await self.llm.generate_structured(
            prompt=prompt,
            response_model=SynthesisOutput,
            system_instruction="You are a Chief Strategy Officer providing unified decision intelligence."
        )

        attributed_claims = []
        for i, claim in enumerate(synthesis_output.attributed_claims):
            # Resolve source finding IDs from contributing agents
            source_ids = [
                f.finding_id for f in state.findings
                if any(
                    agent.lower() in f.agent_name.lower() or f.agent_name.lower() in agent.lower()
                    or any(w.lower() in f.agent_name.lower() for w in agent.split() if len(w) > 3)
                    for agent in claim.contributing_agents
                )
            ]
            if not source_ids and state.findings:
                source_ids = [f.finding_id for f in state.findings[:2]]
            attributed_claims.append(
                AttributedClaim(
                    claim_id=f"REC-{i+1:02d}",
                    statement=claim.statement,
                    source_finding_ids=source_ids,
                    contributing_agents=claim.contributing_agents,
                    confidence_score=claim.confidence,
                    rationale=claim.rationale
                )
            )

        roadmap_dicts = [
            p.model_dump() if hasattr(p, "model_dump") else p
            for p in synthesis_output.phased_roadmap
        ]
        mitigation_dicts = [
            r.model_dump() if hasattr(r, "model_dump") else r
            for r in synthesis_output.risk_mitigation_plan
        ]

        state.final_recommendation = FinalRecommendation(
            executive_summary=synthesis_output.executive_summary,
            strategic_verdict=synthesis_output.strategic_verdict,
            phased_roadmap=roadmap_dicts,
            risk_mitigation_plan=mitigation_dicts,
            attributed_claims=attributed_claims
        )
        state.is_completed = True

        for status in state.agent_statuses.values():
            status.state = "resolved"
            status.last_action = "Deliberation completed successfully"

        synth_event = ExecutionEvent(
            event_id=f"EVT-{uuid.uuid4().hex[:8]}",
            run_id=state.run_id,
            event_type="FINAL_SYNTHESIS_COMPLETED",
            title="Unified Decision Intelligence Recommendation Generated",
            data=state.final_recommendation.model_dump()
        )
        state.execution_events.append(synth_event)
        if event_callback:
            event_callback(synth_event)

        return state


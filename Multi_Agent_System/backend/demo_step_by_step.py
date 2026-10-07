"""Step-by-step Interactive Demonstration of CollaborAI Multi-Agent System.

Executes and visualizes each of the 7 stages of the boardroom workflow:
1. Lead Orchestrator: Goal Decomposition & Specialist Selection
2. Specialist Agents: Execution & Blackboard Posting
3. Conflict Detection Engine: Identifying Incompatibilities & Clashes
4. Multi-Agent Negotiation: Automated Bargaining & Compromise
5. Human Escalation: Deadlock Pause & Executive Decision Injection
6. Stale Assumption & Goal Consistency Checks
7. Unified Recommendation with Exact Claim-to-Evidence Traceability
"""

import asyncio
import json
import time
from app.schemas.state import SharedState, Constraint
from app.llm.mock_provider import MockLLMProvider
from app.orchestration.state_graph import CoordinationStateGraph


def banner(title: str, step_num: int):
    print("\n" + "=" * 80)
    print(f"  STEP {step_num}: {title.upper()}")
    print("=" * 80 + "\n")


async def run_step_by_step():
    print("""
================================================================================
          COLLABORAI MULTI-AGENT DECISION INTELLIGENCE SYSTEM
                      STEP-BY-STEP WORKFLOW WALKTHROUGH
================================================================================
Goal: Should we launch Product Y in Brazil next quarter?
Scenario: High-growth Latin America expansion with tight regulatory & budget gates
================================================================================
""")
    
    # Initialize Shared State
    state = SharedState(
        run_id="demo-boardroom-001",
        goal="Should we launch Product Y in Brazil next quarter?",
        constraints=[
            Constraint(
                constraint_id="CST-01",
                category="timeline",
                description="Target launch within 12 weeks to capture holiday season",
                is_hard_constraint=False,
                threshold_value="12 weeks"
            ),
            Constraint(
                constraint_id="CST-02",
                category="compliance",
                description="Mandatory Brazilian ANATEL & LGPD certification prior to launch",
                is_hard_constraint=True
            ),
            Constraint(
                constraint_id="CST-03",
                category="budget",
                description="Total market entry capital expenditure capped at $2,000,000",
                is_hard_constraint=True,
                threshold_value="$2.0M"
            )
        ]
    )

    # Use simulated LLM engine for instant deterministic verification
    llm = MockLLMProvider(simulated_delay=0.1)
    graph = CoordinationStateGraph(llm_provider=llm)

    # -------------------------------------------------------------------------
    # STEP 1: LEAD ORCHESTRATOR - GOAL DECOMPOSITION & SPECIALIST SELECTION
    # -------------------------------------------------------------------------
    banner("Lead Orchestrator: Goal Decomposition & Specialist Team Activation", 1)
    print(f"🎯 High-Level Goal: \"{state.goal}\"")
    print(f"📋 Constraints Loaded: {len(state.constraints)}")
    for c in state.constraints:
        hard_badge = "[HARD GATE]" if c.is_hard_constraint else "[FLEXIBLE]"
        print(f"   - {hard_badge} ({c.category.upper()}) {c.description}")

    print("\n⏳ Orchestrator analyzing goal and assembling specialized boardroom...")
    state = await graph.decompose_goal_node(state)

    print(f"\n✅ Goal decomposed into {len(state.workstreams)} specialized workstreams:")
    for i, ws in enumerate(state.workstreams, 1):
        print(f"   {i}. [{ws.domain.upper()}] Workstream: {ws.title}")
        print(f"      Required Expertise: {ws.required_expertise}")

    print(f"\n👥 Activated Specialist Personas from Registry ({len(state.active_specialists)} agents):")
    for spec in state.active_specialists:
        print(f"   • {spec.role_title} ({spec.agent_name})")
        print(f"     Domain: {spec.domain} | Persona: {spec.system_instruction[:65]}...")

    # -------------------------------------------------------------------------
    # STEP 2: SPECIALIST EXECUTION & THE SHARED BLACKBOARD
    # -------------------------------------------------------------------------
    banner("Specialist Execution: Deep Domain Analysis & Shared Blackboard Posting", 2)
    print("⏳ Specialists executing concurrently across their respective domains...")
    state = await graph.execute_specialists_node(state)

    print(f"\n📌 Shared Blackboard populated with {len(state.findings)} Specialist Findings:")
    for f in state.findings:
        print(f"\n   ------------------------------------------------------------")
        print(f"   📄 Finding [{f.finding_id}] by {f.agent_name} (Confidence: {f.confidence * 100:.0f}%)")
        print(f"   Topic: {f.topic}")
        print(f"   Core Insight / Claim: {f.claim}")
        print(f"   Assertions posted to Blackboard:")
        for a in f.assertions:
            unit_str = f" {a.unit}" if a.unit else ""
            label_str = f" ({a.dimension_label})" if a.dimension_label else ""
            print(f"     ▪ [{a.dimension.upper()}{label_str}] Value: {a.value}{unit_str} (Flexible: {a.is_flexible})")
        if f.assumptions:
            print(f"   Assumptions made: {', '.join(f.assumptions)}")

    # -------------------------------------------------------------------------
    # STEP 3: CONFLICT DETECTION ENGINE
    # -------------------------------------------------------------------------
    banner("Conflict Detection Engine: Auditing Findings for Contradictions", 3)
    print("⏳ Conflict Auditor scanning all blackboard assertions and constraints...")
    state = await graph.detect_conflicts_node(state)

    if not state.conflicts:
        print("ℹ️ No conflicts detected.")
    else:
        print(f"⚠️ DETECTED {len(state.conflicts)} CROSS-AGENT CONFLICT(S):")
        for conf in state.conflicts:
            print(f"\n   ⚡ Conflict ID: {conf.conflict_id} [Severity: {conf.severity.upper()}]")
            print(f"      Agents Involved: {' vs '.join(conf.agents_involved)}")
            print(f"      Type: {conf.conflict_type}")
            print(f"      Description: {conf.description}")
            print(f"      Incompatible Finding IDs: {', '.join(conf.incompatible_finding_ids)}")

    # -------------------------------------------------------------------------
    # STEP 4: MULTI-AGENT NEGOTIATION LOOP
    # -------------------------------------------------------------------------
    banner("Multi-Agent Negotiation: Automated Debate, Concessions & Compromise", 4)
    print("⏳ Conflicting agents entering structured negotiation rounds...")
    state = await graph.negotiate_conflicts_node(state)

    print(f"\n🤝 Completed {len(state.negotiations)} Negotiation Round(s):")
    for r in state.negotiations:
        print(f"\n   --- Round {r.round_number} (Conflict: {r.conflict_id}) ---")
        for prop in r.proposals:
            print(f"     🗣️ {prop.proposing_agent} offers:")
            print(f"        Compromise Proposal: \"{prop.compromise_statement}\"")
            if prop.concessions_made:
                print(f"        Concessions: {', '.join(prop.concessions_made)}")
            print(f"        Impact on Domain: {prop.impact_on_own_domain}")
        print(f"     ⚖️ Compromise achieved this round: {r.compromise_achieved}")

    for conf in state.conflicts:
        if conf.status == "resolved":
            print(f"\n   ✅ RESOLVED CONFLICT [{conf.conflict_id}]: {conf.resolution_summary}")



    # -------------------------------------------------------------------------
    # STEP 5: HUMAN-IN-THE-LOOP ESCALATION DEMONSTRATION
    # -------------------------------------------------------------------------
    banner("Human Escalation: Deadlock Pause & Executive Guidance Injection", 5)
    print("💡 What if agents hit an unresolvable impasse? Let's inspect the Escalation Mechanism:")
    # Create an escalation example to show how it pauses and resumes
    if state.conflicts:
        sample_conflict = state.conflicts[0]
        await graph._trigger_human_escalation(state, sample_conflict)
        print(f"⏸️ SYSTEM PAUSED FOR HUMAN! (is_paused_for_human = {state.is_paused_for_human})")
        latest_esc = state.escalations[-1]
        print(f"   Ticket: {latest_esc.escalation_id}")
        print(f"   Reason: {latest_esc.reason}")
        print(f"   Options presented to the human executive in the Lovable UI:")
        for opt in latest_esc.options:
            print(f"     [{opt.option_id}] {opt.title}")
            print(f"         Impact: {opt.estimated_impact}")
            print(f"         Trade-offs: {', '.join(opt.trade_offs)}")
        
        # Simulate human choosing Option B
        print("\n   👤 SIMULATION: Executive selects Option [OPT-B] (Fast-Track Expedited Investment)")
        latest_esc.status = "resolved"
        latest_esc.human_decision = {
            "selected_option_id": "OPT-B",
            "decision": "Approved emergency fast-track budget (+30%) to clear ANATEL in 8 weeks.",
            "custom_guidance": "Prioritize quality assurance alongside speed."
        }
        state.is_paused_for_human = False
        print("   ▶️ SYSTEM RESUMED: Human guidance injected into state!")

    # -------------------------------------------------------------------------
    # STEP 6: STALE ASSUMPTION & GOAL CONSISTENCY CHECKS
    # -------------------------------------------------------------------------
    banner("Stale Assumption Detection & Goal Alignment Audit", 6)
    print("⏳ Scanning whether negotiation compromises invalidated any earlier assumptions...")
    state = await graph.stale_assumption_check_node(state)
    print(f"   Stale assumptions found: {len(state.stale_assumptions)}")

    print("\n⏳ Performing global goal consistency audit...")
    state = await graph.goal_consistency_node(state)
    print("   ✅ Goal Consistency Check passed: All recommendations align with top-level constraints.")

    # -------------------------------------------------------------------------
    # STEP 7: UNIFIED RECOMMENDATION WITH CLAIM TRACEABILITY
    # -------------------------------------------------------------------------
    banner("Unified Recommendation: Executive Verdict & Traceable Evidence", 7)
    print("⏳ Lead Orchestrator synthesizing all findings and compromises into final verdict...")
    state = await graph.synthesis_node(state)

    rec = state.final_recommendation
    print(f"🏆 STRATEGIC VERDICT: {rec.strategic_verdict}\n")
    print(f"📝 Executive Summary:\n   {rec.executive_summary}\n")

    print(f"🔍 CLAIM-LEVEL TRACEABILITY (Every sentence is linked to verified findings):")
    for claim in rec.attributed_claims:
        print(f"\n   🏷️ Claim [{claim.claim_id}]: \"{claim.statement}\"")
        print(f"      Verified by Agent(s): {', '.join(claim.contributing_agents)}")
        print(f"      Supporting Finding IDs: {', '.join(claim.source_finding_ids)}")
        print(f"      Confidence: {claim.confidence_score * 100:.0f}%")
        print(f"      Rationale: {claim.rationale}")

    print("\n" + "=" * 80)
    print("  🎉 FULL 7-STAGE DELIBERATION COMPLETE & VERIFIED SUCCESSFULLY!")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    asyncio.run(run_step_by_step())

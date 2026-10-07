import React, { useState, useEffect } from 'react';
import {
  Scale,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  CircleDot,
} from 'lucide-react';
import {
  ScenarioPreset,
  AttributedClaim,
  BenchmarkResponse,
} from './types/schema';
import {
  fetchScenarios,
  createRun,
  submitEscalation,
  runBenchmark,
} from './services/api';
import { useRunWebSocket } from './hooks/useRunWebSocket';
import { GoalInputPanel } from './components/input/GoalInputPanel';
import { AgentGraphView } from './components/graph/AgentGraphView';
import { BlackboardPanel } from './components/panels/BlackboardPanel';
import { ConflictPanel } from './components/panels/ConflictPanel';
import { NegotiationPanel } from './components/panels/NegotiationPanel';
import { AgentTeamPanel } from './components/panels/AgentTeamPanel';
import { TimelinePanel } from './components/panels/TimelinePanel';
import { SynthesisPanel } from './components/panels/SynthesisPanel';
import { AttributionPanel } from './components/panels/AttributionPanel';
import { EscalationModal } from './components/panels/EscalationModal';
import { BenchmarkModal } from './components/panels/BenchmarkModal';

export const App: React.FC = () => {
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioPreset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'blackboard' | 'conflicts' | 'negotiation' | 'team' | 'timeline'>('blackboard');

  // Attribution inspection highlights
  const [highlightedAgents, setHighlightedAgents] = useState<string[]>([]);
  const [highlightedFindingIds, setHighlightedFindingIds] = useState<string[]>([]);
  const [selectedClaimId, setSelectedClaimId] = useState<string | undefined>();

  // Modals
  const [isEscalationOpen, setIsEscalationOpen] = useState(false);
  const [isSubmittingEscalation, setIsSubmittingEscalation] = useState(false);
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkResponse | null>(null);
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState(false);
  const [isBenchmarkLoading, setIsBenchmarkLoading] = useState(false);

  // Real-time WebSocket hook
  const { state, isConnected, latestEvent, refreshState } = useRunWebSocket(currentRunId);

  // Load preset scenarios on mount
  useEffect(() => {
    fetchScenarios()
      .then(setScenarios)
      .catch((err) => console.error('Failed to load presets:', err));
  }, []);

  // Open Escalation modal automatically if run pauses for human
  useEffect(() => {
    if (state?.is_paused_for_human) {
      setIsEscalationOpen(true);
    }
  }, [state?.is_paused_for_human]);

  // Switch to conflict/negotiation tab automatically when conflict occurs
  useEffect(() => {
    if (latestEvent?.event_type === 'CONFLICT_DETECTED') {
      setActiveTab('conflicts');
    } else if (latestEvent?.event_type === 'NEGOTIATION_RESOLVED') {
      setActiveTab('negotiation');
    }
  }, [latestEvent]);

  // Launch a new multi-agent deliberation
  const handleStartRun = async (params: {
    goal: string;
    constraints: any[];
    scenario_id?: string;
    simulation_mode: boolean;
  }) => {
    setIsLoading(true);
    try {
      const newState = await createRun(params);
      setCurrentRunId(newState.run_id);
      setActiveTab('blackboard');
      setHighlightedAgents([]);
      setHighlightedFindingIds([]);
      setSelectedClaimId(undefined);
    } catch (err: any) {
      alert(`Error starting run: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit human escalation decision
  const handleSubmitEscalation = async (selectedOptionId: string, customGuidance?: string) => {
    if (!currentRunId || !state?.escalations?.length) return;
    const activeEsc = state.escalations.find((e) => e.status === 'pending') || state.escalations[0];
    setIsSubmittingEscalation(true);
    try {
      await submitEscalation({
        runId: currentRunId,
        escalationId: activeEsc.escalation_id,
        selectedOptionId,
        customGuidance,
      });
      setIsEscalationOpen(false);
      refreshState();
    } catch (err: any) {
      alert(`Escalation error: ${err.message}`);
    } finally {
      setIsSubmittingEscalation(false);
    }
  };

  // Benchmark against Single-LLM baseline
  const handleOpenBenchmark = async () => {
    if (!currentRunId) {
      alert('Please start a deliberation run first to compare.');
      return;
    }
    setIsBenchmarkOpen(true);
    setIsBenchmarkLoading(true);
    try {
      const data = await runBenchmark(currentRunId);
      setBenchmarkData(data);
    } catch (err: any) {
      alert(`Benchmark error: ${err.message}`);
      setIsBenchmarkOpen(false);
    } finally {
      setIsBenchmarkLoading(false);
    }
  };

  // Claim hover handlers for attribution
  const handleHoverClaim = (contributingAgents: string[], sourceFindingIds: string[]) => {
    setHighlightedAgents(contributingAgents);
    setHighlightedFindingIds(sourceFindingIds);
  };

  const handleLeaveClaim = () => {
    if (!selectedClaimId) {
      setHighlightedAgents([]);
      setHighlightedFindingIds([]);
    }
  };

  const handleSelectClaim = (claim: AttributedClaim) => {
    setSelectedClaimId(claim.claim_id);
    setHighlightedAgents(claim.contributing_agents);
    setHighlightedFindingIds(claim.source_finding_ids);
  };

  const activeEscalation = state?.escalations?.find((e) => e.status === 'pending') || null;

  return (
    <div className="app-shell min-h-screen flex flex-col font-sans selection:bg-[#e8b8a7] selection:text-[#25231f]">
      {/* Product navigation: identity, current workspace, and only one primary utility. */}
      <header className="sticky top-0 z-40 border-b border-[#ded6c8] bg-[#f5f1e8]/95 px-4 py-3 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#b95432]" aria-hidden="true" />
            <div className="hidden items-center gap-2 text-sm sm:flex">
              <h1 className="font-semibold tracking-[-0.02em] text-[#25231f]">CollaborAI</h1>
              <ChevronRight className="h-3.5 w-3.5 text-[#a39a8d]" />
              <span className="text-[#756e64]">Decision workspace</span>
            </div>
            <h1 className="text-base font-semibold tracking-[-0.02em] text-[#25231f] sm:hidden">CollaborAI</h1>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden items-center gap-2 px-3 py-1.5 text-[11px] font-medium text-[#756e64] md:flex">
              <CircleDot className={`h-3.5 w-3.5 ${isConnected ? 'text-[#557564]' : 'text-[#a39a8d]'}`} />
              <span>{isConnected ? 'Session connected' : 'Simulation ready'}</span>
            </div>
            <button
              onClick={handleOpenBenchmark}
              disabled={!currentRunId}
              className="focus-ring inline-flex items-center gap-2 rounded-lg border border-[#d7cec0] bg-[#fffdf8] px-3 py-2 text-xs font-medium text-[#4d4840] transition hover:border-[#b95432] hover:text-[#8f3e25] disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Scale className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Compare baseline</span>
              <span className="sm:hidden">Compare</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto p-4 md:p-8 space-y-10">
        {/* Human Escalation Alert Banner */}
        {state?.is_paused_for_human && activeEscalation && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/60 shadow-xl flex items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-200">
                  Human Escalation Action Required
                </h3>
                <p className="text-xs text-rose-300/80">
                  Specialist agents deadlocked during negotiation. Execution is paused awaiting your intervention.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsEscalationOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 shrink-0 transition"
            >
              Resolve Escalation
            </button>
          </div>
        )}

        {/* 1. Goal Input & Presets */}
        <GoalInputPanel
          scenarios={scenarios}
          isLoading={isLoading}
          onStartRun={handleStartRun}
        />

        {/* 2. Interactive React Flow Coordination Graph */}
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="eyebrow">Deliberation monitor</div>
              <h2 className="mt-1 text-lg font-semibold tracking-[-0.025em] text-[#25231f] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#b95432]" />
                Team activity
              </h2>
            </div>
            {highlightedAgents.length > 0 && (
              <span className="hidden text-xs text-[#8f3e25] font-mono md:block">
                Viewing: {highlightedAgents.join(', ')}
              </span>
            )}
          </div>
          <AgentGraphView
            state={state}
            highlightedAgents={highlightedAgents}
          />
        </section>

        {/* 3. Middle Coordination Panels (Tabs) */}
        <section className="space-y-3 pt-2">
          {/* Tabs bar */}
          <div className="flex items-center gap-1 overflow-x-auto border-b border-[#ded6c8] pb-2">
            <button
              onClick={() => setActiveTab('blackboard')}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'blackboard'
                  ? 'bg-[#f2ddd5] text-[#8f3e25] border border-[#d99c88]'
                  : 'text-[#756e64] hover:text-[#25231f]'
              }`}
            >
              Shared Blackboard ({state?.findings?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('conflicts')}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'conflicts'
                  ? 'bg-[#f2dfdd] text-[#a64840] border border-[#d7a39d]'
                  : 'text-[#756e64] hover:text-[#25231f]'
              }`}
            >
              Detected Conflicts ({state?.conflicts?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('negotiation')}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'negotiation'
                  ? 'bg-[#e7ede5] text-[#456553] border border-[#aec1b2]'
                  : 'text-[#756e64] hover:text-[#25231f]'
              }`}
            >
              Negotiation Room ({state?.negotiations?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'team'
                  ? 'bg-[#f2ddd5] text-[#8f3e25] border border-[#d99c88]'
                  : 'text-[#756e64] hover:text-[#25231f]'
              }`}
            >
              Agent Team ({state?.active_specialists?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'timeline'
                  ? 'bg-[#eee7da] text-[#25231f] border border-[#cfc4b4]'
                  : 'text-[#756e64] hover:text-[#25231f]'
              }`}
            >
              Event Timeline ({state?.execution_events?.length || 0})
            </button>
          </div>

          {/* Active Tab View */}
          <div>
            {activeTab === 'blackboard' && (
              <BlackboardPanel
                findings={state?.findings || []}
                highlightedFindingIds={highlightedFindingIds}
              />
            )}
            {activeTab === 'conflicts' && (
              <ConflictPanel conflicts={state?.conflicts || []} />
            )}
            {activeTab === 'negotiation' && (
              <NegotiationPanel negotiations={state?.negotiations || []} />
            )}
            {activeTab === 'team' && (
              <AgentTeamPanel
                specialists={state?.active_specialists || []}
                statuses={state?.agent_statuses || {}}
                tasks={state?.tasks || []}
              />
            )}
            {activeTab === 'timeline' && (
              <TimelinePanel events={state?.execution_events || []} />
            )}
          </div>
        </section>

        {/* 4. Final Recommendation & Traceability Matrix */}
        {state?.final_recommendation && (
          <section className="space-y-6 pt-4 border-t border-slate-800">
            <SynthesisPanel
              recommendation={state.final_recommendation}
              onHoverClaim={handleHoverClaim}
              onLeaveClaim={handleLeaveClaim}
            />

            <AttributionPanel
              claims={state.final_recommendation.attributed_claims || []}
              selectedClaimId={selectedClaimId}
              onSelectClaim={handleSelectClaim}
              onHoverClaim={handleHoverClaim}
              onLeaveClaim={handleLeaveClaim}
            />
          </section>
        )}
      </main>

      {/* Human Escalation Modal */}
      <EscalationModal
        isOpen={isEscalationOpen}
        escalation={activeEscalation}
        isSubmitting={isSubmittingEscalation}
        onSubmitDecision={handleSubmitEscalation}
        onClose={() => setIsEscalationOpen(false)}
      />

      {/* Single-LLM Baseline Benchmark Modal */}
      <BenchmarkModal
        isOpen={isBenchmarkOpen}
        isLoading={isBenchmarkLoading}
        benchmark={benchmarkData}
        onClose={() => setIsBenchmarkOpen(false)}
      />

    </div>
  );
};

export default App;

import React, { useState, useEffect } from 'react';
import {
  Brain,
  Layers,
  Scale,
  Wifi,
  WifiOff,
  Sparkles,
  ShieldAlert,
  Award,
  Activity,
  RotateCcw,
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-white">
                CollaborAI
              </h1>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                PS-27 MULTI-AGENT
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Collaborative Multi-Agent Decision Intelligence System
            </p>
          </div>
        </div>

        {/* System telemetry pills */}
        <div className="flex items-center gap-3 text-xs">
          {/* Rate Limiter Status */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px]">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Gemini Free Tier (12 RPM Guard)</span>
          </div>

          {/* WebSocket Status */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px]">
            {isConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400">Live Mesh</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span className="text-slate-500">Offline</span>
              </>
            )}
          </div>

          {/* Single-LLM Benchmark Button */}
          <button
            onClick={handleOpenBenchmark}
            disabled={!currentRunId}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-medium bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 hover:border-purple-500/50 disabled:opacity-40 transition"
          >
            <Scale className="w-3.5 h-3.5" />
            Benchmark Baseline
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
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
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Real-Time Multi-Agent Execution & Conflict Mesh
            </h2>
            {highlightedAgents.length > 0 && (
              <span className="text-xs text-cyan-300 font-mono flex items-center gap-1">
                Spotlight: {highlightedAgents.join(', ')}
              </span>
            )}
          </div>
          <AgentGraphView
            state={state}
            highlightedAgents={highlightedAgents}
          />
        </section>

        {/* 3. Middle Coordination Panels (Tabs) */}
        <section className="space-y-3">
          {/* Tabs bar */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('blackboard')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
                activeTab === 'blackboard'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Shared Blackboard ({state?.findings?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('conflicts')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
                activeTab === 'conflicts'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Detected Conflicts ({state?.conflicts?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('negotiation')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
                activeTab === 'negotiation'
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Negotiation Room ({state?.negotiations?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
                activeTab === 'team'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Agent Team ({state?.active_specialists?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
                activeTab === 'timeline'
                  ? 'bg-slate-800 text-slate-200 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
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

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 px-6 py-4 text-center text-xs text-slate-500">
        CollaborAI – PS-27: Collaborative Multi-Agent Coordination System • Built with React, React Flow, FastAPI & Google Gemini Free Tier
      </footer>
    </div>
  );
};

export default App;

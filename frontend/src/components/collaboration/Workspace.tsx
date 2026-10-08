import { Button } from '@/components/ui/button';
import { ClientOnly } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import React, { useState, useEffect } from 'react';
import { formatLocalTime } from '@/lib/utils';
import {
  Network,
  ArrowUpRight,
  ArrowRight,
  Check,
  ChevronRight,
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
} from '@/types/schema';
import {
  fetchScenarios,
  createRun,
  submitEscalation,
  runBenchmark,
} from '@/services/api';
import { useRunWebSocket } from '@/hooks/useRunWebSocket';
import { GoalInputPanel } from '@/components/input/GoalInputPanel';
const AgentGraphView = lazy(() => import('@/components/graph/AgentGraphView').then(m=>({default:m.AgentGraphView})));
import { BlackboardPanel } from '@/components/panels/BlackboardPanel';
import { ConflictPanel } from '@/components/panels/ConflictPanel';
import { NegotiationPanel } from '@/components/panels/NegotiationPanel';
import { AgentTeamPanel } from '@/components/panels/AgentTeamPanel';
import { TimelinePanel } from '@/components/panels/TimelinePanel';
import { SynthesisPanel } from '@/components/panels/SynthesisPanel';
import { AttributionPanel } from '@/components/panels/AttributionPanel';
import { EscalationModal } from '@/components/panels/EscalationModal';
import { BenchmarkModal } from '@/components/panels/BenchmarkModal';
import { StudioAtmosphere } from '@/components/atmosphere/StudioAtmosphere';

export const Workspace: React.FC = () => {
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioPreset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState('');
  const [view, setView] = useState<'overview' | 'recommendations' | 'traceability'>('overview');
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
      .then(data=>{setScenarios(data);setApiAvailable(true);})
      .catch(() => setApiAvailable(false));
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
      setFeedback(`Unable to start deliberation. ${err.message}. The original agent service must be connected.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit human escalation decision
  const handleSubmitEscalation = async (selectedOptionId: string, customGuidance?: string) => {
    if (!currentRunId || !state?.escalations?.length) return;
    const activeEsc = state.escalations.find((e) => e.status === 'pending') || state.escalations[0];
    if (!activeEsc) return;
    setIsSubmittingEscalation(true);
    try {
      await submitEscalation({
        runId: currentRunId,
        escalationId: activeEsc.escalation_id,
        selectedOptionId,
        ...(customGuidance ? { customGuidance } : {}),
      });
      setIsEscalationOpen(false);
      refreshState();
    } catch (err: any) {
      setFeedback(`Unable to submit your decision: ${err.message}`);
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
      setFeedback(`Unable to compare results: ${err.message}`);
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


  const tabs = [
    {id:'blackboard',label:'Findings',count:state?.findings.length||0},
    {id:'conflicts',label:'Conflicts',count:state?.conflicts.length||0},
    {id:'negotiation',label:'Negotiation',count:state?.negotiations.length||0},
    {id:'team',label:'Agents',count:state?.active_specialists.length||0},
    {id:'timeline',label:'Timeline',count:state?.execution_events.length||0},
  ] as const;
  return <div className="workspace">
    <StudioAtmosphere />
    <header className="app-header"><a href="/" className="brand" aria-label="CollaborAI home"><span className="brand-mark"><Network size={23}/></span><span>Collabor<span className="text-primary">AI</span></span><span className="brand-divider"/><span className="brand-descriptor">DECISION INTELLIGENCE</span></a><div className="header-tools"><span className="connection-label"><span className={`status-dot ${isConnected?'active-dot':''}`}/>{isConnected?'Connected':apiAvailable===false?'Service offline':'Ready'}</span><Button variant="outline" size="sm" disabled={!currentRunId} onClick={handleOpenBenchmark}><Scale size={14}/><span>Compare baseline</span></Button><span className="user-avatar" title="Workspace">W</span></div></header>
    <div className="page-shell"><div className="breadcrumb">Workspace <ChevronRight size={12}/><span>Decision studio</span></div>
    <div className="page-heading"><div><div className="section-kicker text-primary">COLLABORATIVE INTELLIGENCE</div><h1>Decision studio<span className="text-primary">.</span></h1><p className="text-muted-foreground text-sm mt-2">Bring every perspective to the table.</p></div><div className="session-label"><span className="status-dot"/><span>{currentRunId?`RUN ${currentRunId.slice(0,8).toUpperCase()}`:'NEW DELIBERATION'}</span></div></div>
    <nav className="main-nav" aria-label="Workspace views"><Button variant="ghost" className={view==='overview'?'nav-active':''} onClick={()=>setView('overview')}>Overview</Button><Button variant="ghost" className={view==='recommendations'?'nav-active':''} onClick={()=>setView('recommendations')}>Recommendation{state?.final_recommendation&&<span className="status-dot active-dot"/>}</Button><Button variant="ghost" className={view==='traceability'?'nav-active':''} onClick={()=>setView('traceability')}>Traceability</Button><span className="nav-end">{state?.is_completed?'Consensus reached':state?'Deliberation in progress':'Your next decision starts here'}</span></nav>
    {feedback&&<div role="alert" className="feedback"><span>{feedback}</span><Button size="sm" variant="ghost" onClick={()=>setFeedback('')}>Dismiss</Button></div>}
    {state?.is_paused_for_human&&activeEscalation&&<div className="feedback"><div><strong>Human decision required</strong><p className="text-xs mt-1">Negotiation is paused awaiting your guidance.</p></div><Button size="sm" onClick={()=>setIsEscalationOpen(true)}>Review options<ArrowRight/></Button></div>}
    <main>{view==='overview'?<div className="studio-layout"><GoalInputPanel scenarios={scenarios} isLoading={isLoading} onStartRun={handleStartRun}/><div className="studio-main">
    <section className="network-section"><div className="section-heading"><div><span className="section-kicker">02 / THE COLLABORATION</span><h2>Different minds. Shared direction.</h2></div><span className="text-xs text-muted-foreground">{String(state?.active_specialists.length||0).padStart(2,'0')} agents</span></div><ClientOnly fallback={<div className="collaboration-canvas"/>}><Suspense fallback={<div className="collaboration-canvas"/>}><AgentGraphView state={state} highlightedAgents={highlightedAgents}/></Suspense></ClientOnly><div className="process-strip">{['Goal','Orchestrate','Collaborate','Resolve','Recommend'].map((step,i)=><React.Fragment key={step}><span className={(state?.is_completed||i===0)?'process-current':''}><span className="process-number">{state?.is_completed?<Check size={10}/>:i+1}</span>{step}</span>{i<4&&<ChevronRight size={11}/>}</React.Fragment>)}</div></section>
    <div className="insight-layout"><section className="findings-section"><div className="panel-tabs" role="tablist" aria-label="Collaboration details">{tabs.map(tab=><Button key={tab.id} variant="ghost" role="tab" aria-selected={activeTab===tab.id} aria-controls="detail-panel" id={`tab-${tab.id}`} className={activeTab===tab.id?'tab-active':''} onClick={()=>setActiveTab(tab.id)}>{tab.label}<span>{tab.count}</span></Button>)}</div><div id="detail-panel" role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
    {activeTab==='blackboard'&&<BlackboardPanel findings={state?.findings||[]} highlightedFindingIds={highlightedFindingIds}/>}
    {activeTab==='conflicts'&&<ConflictPanel conflicts={state?.conflicts||[]}/>}
    {activeTab==='negotiation'&&<NegotiationPanel negotiations={state?.negotiations||[]}/>}
    {activeTab==='team'&&<AgentTeamPanel specialists={state?.active_specialists||[]} statuses={state?.agent_statuses||{}} tasks={state?.tasks||[]}/>}
    {activeTab==='timeline'&&<TimelinePanel events={state?.execution_events||[]}/>}
    </div></section><aside className="activity-sidebar"><div className="flex items-center justify-between"><h3 className="text-sm font-medium">Activity</h3><span className="text-[10px] text-muted-foreground">LIVE FEED</span></div>{state?.execution_events.length?<div className="compact-feed">{[...state.execution_events].reverse().slice(0,6).map(ev=><div className="compact-event" key={ev.event_id} title={`${ev.event_type} · ${ev.agent_name||'System'}`}><span className={`event-point ${ev.event_type==='CONFLICT_DETECTED'?'event-danger':''}`}/><time>{formatLocalTime(ev.timestamp, {hour:'2-digit',minute:'2-digit'})}</time><p>{ev.title}</p>{ev.agent_name&&<span className="text-[10px] text-muted-foreground">{ev.agent_name}</span>}</div>)}</div>:<div className="activity-empty"><span className="activity-symbol"><Activity size={22}/></span><p>Quiet, for now.</p><span>Awaiting the first exchange.</span></div>}<div className="shared-state-summary"><span className="section-kicker">SHARED STATE</span><div><span>Active findings</span><strong>{state?.findings.filter(f=>f.status==='active').length||0}</strong></div><div><span>Stale assumptions</span><strong>{state?.stale_assumptions.filter(a=>!a.resolved).length||0}</strong></div><div><span>Resolved conflicts</span><strong>{state?.conflicts.filter(c=>c.status==='resolved').length||0}</strong></div></div></aside></div>
    {state?.final_recommendation&&<section className="overview-recommendation"><SynthesisPanel recommendation={state.final_recommendation} onHoverClaim={handleHoverClaim} onLeaveClaim={handleLeaveClaim}/><Button variant="link" onClick={()=>setView('traceability')}>View evidence & traceability<ArrowUpRight/></Button></section>}
    </div></div>:<section className="result-view"><div className="section-kicker">{view==='recommendations'?'03 / THE DECISION':'04 / THE EVIDENCE'}</div>{view==='recommendations'?<SynthesisPanel recommendation={state?.final_recommendation||null} onHoverClaim={handleHoverClaim} onLeaveClaim={handleLeaveClaim}/>:<AttributionPanel claims={state?.final_recommendation?.attributed_claims||[]} {...(selectedClaimId ? {selectedClaimId} : {})} onSelectClaim={handleSelectClaim} onHoverClaim={handleHoverClaim} onLeaveClaim={handleLeaveClaim}/>}</section>}</main>
    <footer className="app-footer"><span>CollaborAI <span className="footer-dot">·</span> Many perspectives. One considered decision.</span><span>{apiAvailable===false?'Original agent service not connected':'MULTI-AGENT COORDINATION SYSTEM'}<span className="footer-dot">·</span> PS–27</span></footer></div>
    <EscalationModal isOpen={isEscalationOpen} escalation={activeEscalation} isSubmitting={isSubmittingEscalation} onSubmitDecision={handleSubmitEscalation} onClose={()=>setIsEscalationOpen(false)}/>
    <BenchmarkModal isOpen={isBenchmarkOpen} isLoading={isBenchmarkLoading} benchmark={benchmarkData} onClose={()=>setIsBenchmarkOpen(false)}/>
  </div>;
};

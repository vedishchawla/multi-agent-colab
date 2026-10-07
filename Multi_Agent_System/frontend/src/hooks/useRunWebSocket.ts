import { useEffect, useRef, useState, useCallback } from 'react';
import { SharedState, ExecutionEvent } from '../types/schema';
import { fetchRun } from '../services/api';

export function useRunWebSocket(runId: string | null) {
  const [state, setState] = useState<SharedState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latestEvent, setLatestEvent] = useState<ExecutionEvent | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // Initial fetch of state if runId is set
  const refreshState = useCallback(async () => {
    if (!runId) return;
    try {
      const fullState = await fetchRun(runId);
      setState(fullState);
    } catch (err) {
      console.error('Error fetching run state:', err);
    }
  }, [runId]);

  useEffect(() => {
    if (!runId) {
      setState(null);
      setIsConnected(false);
      return;
    }

    refreshState();

    // Determine WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws/runs/${runId}`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (msgEvent) => {
      try {
        const event: ExecutionEvent = JSON.parse(msgEvent.data);
        setLatestEvent(event);

        setState((prevState) => {
          if (!prevState) return prevState;
          const next = { ...prevState };

          // Append to event log if not duplicate
          if (!next.execution_events.some((e) => e.event_id === event.event_id)) {
            next.execution_events = [...next.execution_events, event];
          }

          // Merge specific event types
          switch (event.event_type) {
            case 'AGENT_STATUS_UPDATED': {
              const agentName = event.agent_name;
              if (agentName && next.agent_statuses[agentName]) {
                next.agent_statuses = {
                  ...next.agent_statuses,
                  [agentName]: {
                    ...next.agent_statuses[agentName],
                    state: event.data.status || 'thinking',
                    last_action: event.title || next.agent_statuses[agentName].last_action,
                  },
                };
              }
              break;
            }
            case 'FINDING_POSTED': {
              const finding = event.data as any;
              if (finding && !next.findings.some((f) => f.finding_id === finding.finding_id)) {
                next.findings = [...next.findings, finding];
              }
              break;
            }
            case 'CONFLICT_DETECTED': {
              const conflict = event.data as any;
              if (conflict && !next.conflicts.some((c) => c.conflict_id === conflict.conflict_id)) {
                next.conflicts = [...next.conflicts, conflict];
              }
              break;
            }
            case 'NEGOTIATION_RESOLVED': {
              const negRound = event.data as any;
              if (negRound) {
                next.negotiations = [...next.negotiations, negRound];
                // Update conflict status to resolved
                next.conflicts = next.conflicts.map((c) =>
                  c.conflict_id === negRound.conflict_id ? { ...c, status: 'resolved' } : c
                );
              }
              break;
            }
            case 'HUMAN_ESCALATION_TRIGGERED': {
              const esc = event.data as any;
              next.is_paused_for_human = true;
              if (esc && !next.escalations.some((e) => e.escalation_id === esc.escalation_id)) {
                next.escalations = [...next.escalations, esc];
              }
              break;
            }
            case 'FINAL_SYNTHESIS_COMPLETED': {
              next.final_recommendation = event.data as any;
              next.is_completed = true;
              break;
            }
            case 'WORKSTREAMS_DECOMPOSED': {
              if (event.data?.specialists_profiles) {
                next.active_specialists = event.data.specialists_profiles as any;
              }
              if (event.data?.tasks) {
                next.tasks = event.data.tasks as any;
              }
              if (event.data?.workstreams) {
                next.workstreams = event.data.workstreams as any;
              }
              break;
            }
            case 'RUN_RESUMED': {
              next.is_paused_for_human = false;
              break;
            }
            case 'STALE_ASSUMPTION_FLAGGED': {
              const staleData = event.data as any;
              if (staleData) {
                next.stale_assumptions = [...next.stale_assumptions, staleData];
                // Mark the affected finding as stale in the findings list
                const findingId = staleData.finding_id;
                next.findings = next.findings.map((f) =>
                  f.finding_id === findingId ? { ...f, status: 'stale' } : f
                );
                // Update agent status
                const agentName = staleData.impacted_agent;
                if (agentName && next.agent_statuses[agentName]) {
                  next.agent_statuses = {
                    ...next.agent_statuses,
                    [agentName]: {
                      ...next.agent_statuses[agentName],
                      state: 're_evaluating',
                      last_action: `Assumption invalidated: ${staleData.reason?.substring(0, 80) || ''}`,
                    },
                  };
                }
              }
              break;
            }
            case 'GOAL_CONSISTENCY_CHECKED': {
              // No state mutation needed — event is logged in timeline
              break;
            }
          }

          return next;
        });
      } catch (err) {
        console.error('Failed to parse WebSocket event:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    // Heartbeat ping
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send('ping');
      }
    }, 15000);

    // Active sync polling every 2.5s to ensure complete state fidelity
    const pollInterval = setInterval(() => {
      refreshState();
    }, 2500);

    return () => {
      clearInterval(pingInterval);
      clearInterval(pollInterval);
      ws.close();
    };
  }, [runId, refreshState]);

  return { state, setState, isConnected, latestEvent, refreshState };
}

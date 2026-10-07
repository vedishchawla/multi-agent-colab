import React from 'react';
import { Clock, Cpu, CheckCircle, AlertTriangle, ShieldCheck, Flag } from 'lucide-react';
import { ExecutionEvent } from '../../types/schema';

interface TimelinePanelProps {
  events: ExecutionEvent[];
}

export const TimelinePanel: React.FC<TimelinePanelProps> = ({ events }) => {
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'RUN_STARTED':
      case 'RUN_COMPLETED':
        return <Flag className="w-3.5 h-3.5 text-cyan-400" />;
      case 'WORKSTREAMS_DECOMPOSED':
        return <Cpu className="w-3.5 h-3.5 text-indigo-400" />;
      case 'FINDING_POSTED':
        return <CheckCircle className="w-3.5 h-3.5 text-blue-400" />;
      case 'CONFLICT_DETECTED':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
      case 'NEGOTIATION_RESOLVED':
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />;
      case 'HUMAN_ESCALATION_TRIGGERED':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl p-5 shadow-xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Execution Event Stream
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                {events.length}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Live chronological audit stream of all coordination events
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[500px]">
        {events.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            Awaiting events...
          </div>
        ) : (
          [...events].reverse().map((ev, index) => (
            <div
              key={ev.event_id || index}
              className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs flex items-start gap-3"
            >
              <div className="mt-0.5 p-1 rounded-md bg-slate-900 border border-slate-800 shrink-0">
                {getEventIcon(ev.event_type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="font-semibold text-slate-200 truncate">
                    {ev.title || ev.event_type}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {ev.agent_name && (
                  <span className="text-[11px] text-cyan-400 font-mono block">
                    Agent: {ev.agent_name}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

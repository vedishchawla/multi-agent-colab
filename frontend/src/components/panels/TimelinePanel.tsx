import { Button } from '@/components/ui/button';
import React from 'react';
import { formatLocalTime } from '@/lib/utils';
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
        return <Flag className="w-3.5 h-3.5 text-primary" />;
      case 'WORKSTREAMS_DECOMPOSED':
        return <Cpu className="w-3.5 h-3.5 text-primary" />;
      case 'FINDING_POSTED':
        return <CheckCircle className="w-3.5 h-3.5 text-primary" />;
      case 'CONFLICT_DETECTED':
        return <AlertTriangle className="w-3.5 h-3.5 text-destructive" />;
      case 'NEGOTIATION_RESOLVED':
        return <ShieldCheck className="w-3.5 h-3.5 text-success" />;
      case 'HUMAN_ESCALATION_TRIGGERED':
        return <AlertTriangle className="w-3.5 h-3.5 text-primary" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  return (
    <div className="panel-content h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              Activity
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
                {events.length}
              </span>
            </h3>
            
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[500px]">
        {events.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-xs">
            Awaiting events...
          </div>
        ) : (
          [...events].reverse().map((ev, index) => (
            <div
              key={ev.event_id || index}
              className="p-3 rounded-md bg-background border border-border text-xs flex items-start gap-3"
            >
              <div className="mt-0.5 p-1 rounded-md bg-muted border border-border shrink-0">
                {getEventIcon(ev.event_type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="font-semibold text-foreground truncate">
                    {ev.title || ev.event_type}
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                    {formatLocalTime(ev.timestamp)}
                  </span>
                </div>
                {ev.agent_name && (
                  <span className="text-[11px] text-primary font-mono block">
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

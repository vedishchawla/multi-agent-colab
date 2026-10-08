import { Button } from '@/components/ui/button';
import React from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, ArrowRight } from 'lucide-react';
import { Conflict } from '../../types/schema';

interface ConflictPanelProps {
  conflicts: Conflict[];
}

export const ConflictPanel: React.FC<ConflictPanelProps> = ({ conflicts }) => {
  return (
    <div className="panel-content ">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-destructive-soft border border-destructive/30 flex items-center justify-center text-destructive">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              Conflicts
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
                {conflicts.length} detected
              </span>
            </h3>
            
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {conflicts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs">
            <CheckCircle className="w-6 h-6 mx-auto mb-1.5 text-success" />
            No active contradictions detected across specialist assertions.
          </div>
        ) : (
          conflicts.map((conflict) => {
            const isResolved = conflict.status === 'resolved';
            const isEscalated = conflict.status === 'escalated';

            return (
              <div
                key={conflict.conflict_id}
                className={`p-4 rounded-md border transition-all ${
                  isResolved
                    ? 'bg-success-soft border-success/30'
                    : isEscalated
                    ? 'bg-destructive-soft border-destructive/30'
                    : 'bg-accent border-primary/30'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] font-bold text-destructive bg-destructive-soft px-2 py-0.5 rounded border border-destructive/30">
                      {conflict.conflict_id}
                    </span>
                    <span className="text-xs font-semibold text-foreground uppercase tracking-normal">
                      {conflict.conflict_type.replace('_', ' ')}
                    </span>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-normal ${
                      isResolved
                        ? 'bg-success-soft text-success border border-success/30'
                        : isEscalated
                        ? 'bg-destructive-soft text-destructive border border-destructive/30 '
                        : 'bg-accent text-primary border border-primary/30'
                    }`}
                  >
                    {conflict.status}
                  </span>
                </div>

                {/* Agents Involved */}
                <div className="flex items-center gap-2 mb-2 text-xs text-foreground">
                  <span className="text-muted-foreground">Tension between:</span>
                  <span className="font-semibold text-primary">
                    {conflict.agents_involved[0]}
                  </span>
                  <span className="text-destructive font-bold">VS</span>
                  <span className="font-semibold text-primary">
                    {conflict.agents_involved[1] || 'Peers'}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-foreground mb-2 leading-relaxed">
                  {conflict.description}
                </p>

                {/* Resolution Summary if resolved */}
                {conflict.resolution_summary && (
                  <div className="mt-2.5 p-2.5 rounded-lg bg-success-soft border border-success/30 text-xs text-success">
                    <span className="font-semibold uppercase tracking-normal text-[11px] text-success block mb-0.5">
                      ✓ Negotiated Compromise:
                    </span>
                    {conflict.resolution_summary}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

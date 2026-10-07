import React from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, ArrowRight } from 'lucide-react';
import { Conflict } from '../../types/schema';

interface ConflictPanelProps {
  conflicts: Conflict[];
}

export const ConflictPanel: React.FC<ConflictPanelProps> = ({ conflicts }) => {
  return (
    <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Cross-Agent Conflict Detector
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                {conflicts.length} detected
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Autonomous identification of incompatible assertions and statutory constraints
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {conflicts.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            <CheckCircle className="w-6 h-6 mx-auto mb-1.5 text-emerald-500/60" />
            No active contradictions detected across specialist assertions.
          </div>
        ) : (
          conflicts.map((conflict) => {
            const isResolved = conflict.status === 'resolved';
            const isEscalated = conflict.status === 'escalated';

            return (
              <div
                key={conflict.conflict_id}
                className={`p-4 rounded-xl border transition-all ${
                  isResolved
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : isEscalated
                    ? 'bg-rose-950/20 border-rose-500/50'
                    : 'bg-amber-950/20 border-amber-500/50'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40">
                      {conflict.conflict_id}
                    </span>
                    <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
                      {conflict.conflict_type.replace('_', ' ')}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      isResolved
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : isEscalated
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {conflict.status}
                  </span>
                </div>

                {/* Agents Involved */}
                <div className="flex items-center gap-2 mb-2 text-xs text-slate-300">
                  <span className="text-slate-500">Tension between:</span>
                  <span className="font-semibold text-cyan-400">
                    {conflict.agents_involved[0]}
                  </span>
                  <span className="text-rose-400 font-bold">VS</span>
                  <span className="font-semibold text-orange-400">
                    {conflict.agents_involved[1] || 'Peers'}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-200 mb-2 leading-relaxed">
                  {conflict.description}
                </p>

                {/* Resolution Summary if resolved */}
                {conflict.resolution_summary && (
                  <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200">
                    <span className="font-semibold uppercase tracking-wider text-[10px] text-emerald-400 block mb-0.5">
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

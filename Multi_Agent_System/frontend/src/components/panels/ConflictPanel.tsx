import React from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, ArrowRight } from 'lucide-react';
import { Conflict } from '../../types/schema';

interface ConflictPanelProps {
  conflicts: Conflict[];
}

export const ConflictPanel: React.FC<ConflictPanelProps> = ({ conflicts }) => {
  return (
    <div className="surface p-5">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#ded6c8]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#f2dfdd] border border-[#d7a39d] flex items-center justify-center text-[#a64840]">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#25231f] flex items-center gap-2">
              Cross-Agent Conflict Detector
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#f1ece3] text-[#756e64] font-mono">
                {conflicts.length} detected
              </span>
            </h3>
            <p className="text-xs text-[#756e64]">
              Autonomous identification of incompatible assertions and statutory constraints
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {conflicts.length === 0 ? (
          <div className="text-center py-8 text-[#756e64] text-xs">
            <CheckCircle className="w-6 h-6 mx-auto mb-1.5 text-[#557564]" />
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
                    ? 'bg-[#f0f5ed] border-[#aec1b2]'
                    : isEscalated
                    ? 'bg-[#f8ece9] border-[#d7a39d]'
                    : 'bg-[#fbf4e8] border-[#dfc087]'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] font-bold text-[#a64840] bg-[#f2dfdd] px-2 py-0.5 rounded border border-[#d7a39d]">
                      {conflict.conflict_id}
                    </span>
                    <span className="text-xs font-semibold text-[#39352f] uppercase tracking-wide">
                      {conflict.conflict_type.replace('_', ' ')}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      isResolved
                        ? 'bg-[#e7ede5] text-[#456553] border border-[#aec1b2]'
                        : isEscalated
                        ? 'bg-[#f2dfdd] text-[#a64840] border border-[#d7a39d] animate-pulse'
                        : 'bg-[#f5ead5] text-[#8a5c1e] border border-[#dfc087]'
                    }`}
                  >
                    {conflict.status}
                  </span>
                </div>

                {/* Agents Involved */}
                <div className="flex items-center gap-2 mb-2 text-xs text-[#625d54]">
                  <span className="text-[#756e64]">Tension between:</span>
                  <span className="font-semibold text-[#8f3e25]">
                    {conflict.agents_involved[0]}
                  </span>
                  <span className="text-[#a64840] font-bold">VS</span>
                  <span className="font-semibold text-[#8f3e25]">
                    {conflict.agents_involved[1] || 'Peers'}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-[#39352f] mb-2 leading-relaxed">
                  {conflict.description}
                </p>

                {/* Resolution Summary if resolved */}
                {conflict.resolution_summary && (
                  <div className="mt-2.5 p-2.5 rounded-lg bg-[#e7ede5] border border-[#aec1b2] text-xs text-[#456553]">
                    <span className="font-semibold uppercase tracking-wider text-[10px] text-[#456553] block mb-0.5">
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

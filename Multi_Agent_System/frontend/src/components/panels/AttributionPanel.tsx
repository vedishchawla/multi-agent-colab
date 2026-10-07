import React from 'react';
import { Sparkles, Eye, CheckCircle2, ShieldCheck, Link2 } from 'lucide-react';
import { AttributedClaim } from '../../types/schema';

interface AttributionPanelProps {
  claims: AttributedClaim[];
  selectedClaimId?: string;
  onSelectClaim: (claim: AttributedClaim) => void;
  onHoverClaim?: (contributingAgents: string[], sourceFindingIds: string[]) => void;
  onLeaveClaim?: () => void;
}

export const AttributionPanel: React.FC<AttributionPanelProps> = ({
  claims,
  selectedClaimId,
  onSelectClaim,
  onHoverClaim,
  onLeaveClaim,
}) => {
  return (
    <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Link2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Attribution & Traceability Matrix
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                {claims.length} claims verified
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Interactive sentence-level evidence provenance tracing decisions to source agents
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {claims.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            <Eye className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
            Claim attribution will activate once final deliberation synthesis is generated.
          </div>
        ) : (
          claims.map((claim) => {
            const isSelected = selectedClaimId === claim.claim_id;

            return (
              <div
                key={claim.claim_id}
                onMouseEnter={() =>
                  onHoverClaim?.(claim.contributing_agents, claim.source_finding_ids)
                }
                onMouseLeave={() => onLeaveClaim?.()}
                onClick={() => onSelectClaim(claim)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-cyan-950/30 border-cyan-400 ring-2 ring-cyan-400/40 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-cyan-400 bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-800/40">
                      {claim.claim_id}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Hover to spotlight originating agent nodes & findings
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-300">
                    {Math.round(claim.confidence_score * 100)}% verified
                  </span>
                </div>

                {/* Claim Statement */}
                <p className="text-xs text-slate-100 font-medium leading-relaxed mb-2.5">
                  "{claim.statement}"
                </p>

                {/* Provenance Tags */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60 text-xs">
                  <span className="text-[10px] uppercase font-semibold text-slate-500">
                    Sourced From:
                  </span>
                  {claim.contributing_agents.map((agent, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    >
                      {agent}
                    </span>
                  ))}

                  {claim.source_finding_ids.map((fId, i) => (
                    <span
                      key={i}
                      className="font-mono text-[10px] bg-slate-800 text-cyan-400 px-1.5 py-0.5 rounded border border-slate-700"
                    >
                      {fId}
                    </span>
                  ))}
                </div>

                {/* Supporting Rationale */}
                <div className="mt-2 text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800/40 italic">
                  Rationale: {claim.rationale}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

import { Button } from '@/components/ui/button';
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
    <div className="panel-content ">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent border border-primary/30 flex items-center justify-center text-primary">
            <Link2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              Traceability
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
                {claims.length} claims verified
              </span>
            </h3>
            
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {claims.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs">
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
                role="button" tabIndex={0} aria-pressed={isSelected} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelectClaim(claim);}}} onFocus={()=>onHoverClaim?.(claim.contributing_agents,claim.source_finding_ids)} onBlur={()=>onLeaveClaim?.()} onClick={() => onSelectClaim(claim)}
                className={`p-4 rounded-xl border cursor-pointer ${
                  isSelected
                    ? 'bg-accent border-primary/30 ring-2 ring-primary/30'
                    : 'bg-background border-border hover:border-border'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-primary bg-accent px-2 py-0.5 rounded border border-primary/30">
                      {claim.claim_id}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Evidence provenance
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-primary">
                    {Math.round(claim.confidence_score * 100)}% verified
                  </span>
                </div>

                {/* Claim Statement */}
                <p className="text-xs text-foreground font-medium leading-relaxed mb-2.5">
                  "{claim.statement}"
                </p>

                {/* Provenance Tags */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border text-xs">
                  <span className="text-[11px] uppercase font-semibold text-muted-foreground">
                    Sourced From:
                  </span>
                  {claim.contributing_agents.map((agent, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-accent text-primary border border-primary/30"
                    >
                      {agent}
                    </span>
                  ))}

                  {claim.source_finding_ids.map((fId, i) => (
                    <span
                      key={i}
                      className="font-mono text-[11px] bg-muted text-primary px-1.5 py-0.5 rounded border border-border"
                    >
                      {fId}
                    </span>
                  ))}
                </div>

                {/* Supporting Rationale */}
                <div className="mt-2 text-[11px] text-muted-foreground bg-muted p-2 rounded-lg border border-border italic">
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

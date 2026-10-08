import { Button } from '@/components/ui/button';
import React from 'react';
import { MessageSquare, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { NegotiationRound } from '../../types/schema';

interface NegotiationPanelProps {
  negotiations: NegotiationRound[];
}

export const NegotiationPanel: React.FC<NegotiationPanelProps> = ({
  negotiations,
}) => {
  return (
    <div className="panel-content ">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent border border-primary/30 flex items-center justify-center text-primary">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              Negotiation
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
                {negotiations.length} rounds
              </span>
            </h3>
            
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {negotiations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs">
            <MessageSquare className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
            No active negotiations yet. Negotiation initiates automatically upon conflict detection.
          </div>
        ) : (
          negotiations.map((neg) => (
            <div
              key={neg.round_id}
              className="p-4 rounded-md bg-background border border-border space-y-3"
            >
              {/* Round Header */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-primary bg-accent px-2 py-0.5 rounded border border-primary/30">
                  {neg.round_id} (Round {neg.round_number})
                </span>
                {neg.compromise_achieved ? (
                  <span className="text-[11px] font-bold text-success bg-success-soft px-2 py-0.5 rounded border border-success/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Consensus Formulated
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-primary bg-accent px-2 py-0.5 rounded border border-primary/30">
                    Proposals Under Review
                  </span>
                )}
              </div>

              {/* Proposals from each agent */}
              <div className="space-y-2 pt-1">
                {neg.proposals.map((prop, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-muted border border-border text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-foreground font-medium">
                      <span className="text-primary font-semibold">{prop.proposing_agent}</span>
                      <span className="text-[11px] text-muted-foreground">Proposal #{idx + 1}</span>
                    </div>

                    <p className="text-foreground leading-relaxed font-normal">
                      "{prop.compromise_statement}"
                    </p>

                    {prop.concessions_made && prop.concessions_made.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                          Concessions:
                        </span>
                        {prop.concessions_made.map((c, i) => (
                          <span
                            key={i}
                            className="text-[11px] bg-muted text-foreground px-2 py-0.5 rounded border border-border"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Synthesized Compromise */}
              {neg.synthesis_statement && (
                <div className="p-3 rounded-lg bg-success-soft border border-success/30 text-xs text-success space-y-1">
                  <div className="font-semibold text-success flex items-center gap-1.5 text-[11px] uppercase tracking-normal">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Synthesized Consensus Agreement:
                  </div>
                  <p className="leading-relaxed">{neg.synthesis_statement}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

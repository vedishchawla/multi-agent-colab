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
    <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Multi-Agent Negotiation Room
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                {negotiations.length} rounds
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Iterative trade-off proposals, concessions, and consensus synthesis
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {negotiations.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            <MessageSquare className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
            No active negotiations yet. Negotiation initiates automatically upon conflict detection.
          </div>
        ) : (
          negotiations.map((neg) => (
            <div
              key={neg.round_id}
              className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3"
            >
              {/* Round Header */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-indigo-400 bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-800/40">
                  {neg.round_id} (Round {neg.round_number})
                </span>
                {neg.compromise_achieved ? (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Consensus Formulated
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    Proposals Under Review
                  </span>
                )}
              </div>

              {/* Proposals from each agent */}
              <div className="space-y-2 pt-1">
                {neg.proposals.map((prop, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/60 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-slate-300 font-medium">
                      <span className="text-cyan-400 font-semibold">{prop.proposing_agent}</span>
                      <span className="text-[10px] text-slate-500">Proposal #{idx + 1}</span>
                    </div>

                    <p className="text-slate-200 leading-relaxed font-normal">
                      "{prop.compromise_statement}"
                    </p>

                    {prop.concessions_made && prop.concessions_made.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase">
                          Concessions:
                        </span>
                        {prop.concessions_made.map((c, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700/60"
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
                <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-200 space-y-1">
                  <div className="font-semibold text-emerald-400 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
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

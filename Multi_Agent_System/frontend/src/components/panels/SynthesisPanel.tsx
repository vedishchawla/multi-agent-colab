import React from 'react';
import { Award, CheckCircle, Calendar, ShieldCheck, AlertOctagon } from 'lucide-react';
import { FinalRecommendation } from '../../types/schema';

interface SynthesisPanelProps {
  recommendation: FinalRecommendation | null;
  onHoverClaim?: (contributingAgents: string[], sourceFindingIds: string[]) => void;
  onLeaveClaim?: () => void;
}

export const SynthesisPanel: React.FC<SynthesisPanelProps> = ({
  recommendation,
  onHoverClaim,
  onLeaveClaim,
}) => {
  if (!recommendation) {
    return (
      <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl p-6 shadow-xl text-center py-12 text-slate-500 text-xs">
        <Award className="w-8 h-8 mx-auto mb-2 opacity-40" />
        Deliberation in progress. Unified recommendation will be synthesized upon conclusion.
      </div>
    );
  }

  const getVerdictBadge = () => {
    switch (recommendation.strategic_verdict) {
      case 'GO':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            ✓ Recommendation: GO (Approved)
          </span>
        );
      case 'GO_WITH_CONDITIONS':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
            ⚡ Recommendation: GO WITH CONDITIONS
          </span>
        );
      case 'DEFER':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40">
            ⏸ Recommendation: DEFER (Phase Gates Required)
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/40">
            ✕ Recommendation: NO-GO
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Unified Decision Intelligence Recommendation
            </h3>
            <p className="text-xs text-slate-400">
              Synthesized collective intelligence with end-to-end multi-agent consensus
            </p>
          </div>
        </div>
        <div>{getVerdictBadge()}</div>
      </div>

      {/* Executive Summary Narrative */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80">
        <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1.5">
          Executive Strategic Verdict
        </h4>
        <p className="text-sm text-slate-200 leading-relaxed font-normal">
          {recommendation.executive_summary}
        </p>
      </div>

      {/* Phased Roadmap */}
      {recommendation.phased_roadmap && recommendation.phased_roadmap.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            Phased Implementation Roadmap
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recommendation.phased_roadmap.map((phase, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between font-bold text-slate-200">
                  <span className="text-cyan-300">{phase.phase}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Duration: {phase.duration}
                </div>
                <div className="text-[11px] text-slate-500">
                  Owner: {phase.owner}
                </div>
                {phase.actions && phase.actions.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 text-slate-300 pt-1 text-[11px]">
                    {phase.actions.map((act, i) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Mitigation Plan */}
      {recommendation.risk_mitigation_plan && recommendation.risk_mitigation_plan.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Risk Mitigation & Defense Matrix
          </h4>
          <div className="space-y-2">
            {recommendation.risk_mitigation_plan.map((risk, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-[200px]">
                  <span className="font-semibold text-rose-300 block mb-0.5">
                    {risk.risk}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    {risk.mitigation}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 block mb-1">
                    Severity: {risk.severity}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Monitor: {risk.monitoring}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

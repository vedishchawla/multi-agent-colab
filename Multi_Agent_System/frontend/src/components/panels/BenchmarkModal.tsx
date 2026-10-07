import React from 'react';
import { X, Scale, AlertOctagon, CheckCircle2, TrendingUp, Layers } from 'lucide-react';
import { BenchmarkResponse } from '../../types/schema';

interface BenchmarkModalProps {
  benchmark: BenchmarkResponse | null;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
}

export const BenchmarkModal: React.FC<BenchmarkModalProps> = ({
  benchmark,
  isOpen,
  isLoading,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Single-LLM vs CollaborAI Multi-Agent Comparison
              </h3>
              <p className="text-xs text-slate-400">
                Empirical demonstration of why multi-agent coordination outperforms monolithic prompting
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            <Scale className="w-10 h-10 mx-auto mb-3 animate-spin text-purple-400" />
            Running monolithic baseline on identical goal & constraints...
          </div>
        ) : benchmark ? (
          <div className="space-y-5">
            {/* Side-by-Side Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Monolithic Single-LLM */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                    Single-LLM Baseline (Direct Prompt)
                  </span>
                  <span className="font-mono text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                    Depth: {Math.round(benchmark.depth_score_single_llm * 100)}%
                  </span>
                </div>

                <div>
                  <span className="font-semibold text-slate-400 uppercase text-[10px] block mb-1">
                    Verdict:
                  </span>
                  <div className="text-rose-300 font-semibold">{benchmark.single_llm_verdict}</div>
                </div>

                <div>
                  <span className="font-semibold text-slate-400 uppercase text-[10px] block mb-1">
                    Monolithic Response Snippet:
                  </span>
                  <p className="text-slate-300 italic bg-slate-900/60 p-2.5 rounded border border-slate-800 leading-relaxed">
                    "{benchmark.single_llm_summary}..."
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-rose-400 uppercase text-[10px] block mb-1 flex items-center gap-1">
                    <AlertOctagon className="w-3.5 h-3.5" />
                    Critical Blindspots & Missed Friction:
                  </span>
                  <ul className="space-y-1 text-slate-400 list-disc list-inside">
                    {benchmark.single_llm_missed_conflicts.map((m, i) => (
                      <li key={i} className="text-[11px] text-rose-300/90">{m}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right Column: CollaborAI Multi-Agent */}
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/40 text-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-cyan-500/30">
                  <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                    CollaborAI Multi-Agent Coordination
                  </span>
                  <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                    Depth: {Math.round(benchmark.depth_score_multi_agent * 100)}%
                  </span>
                </div>

                <div>
                  <span className="font-semibold text-cyan-400 uppercase text-[10px] block mb-1">
                    Reconciled Verdict:
                  </span>
                  <div className="text-emerald-300 font-semibold">{benchmark.multi_agent_verdict}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                    <span className="text-lg font-bold text-rose-400 block">
                      {benchmark.multi_agent_conflicts_surfaced}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase">Conflicts Surfaced</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                    <span className="text-lg font-bold text-emerald-400 block">
                      {benchmark.multi_agent_negotiations_completed}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase">Consensus Rounds</span>
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-emerald-400 uppercase text-[10px] block mb-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Coordination Strengths:
                  </span>
                  <ul className="space-y-1 text-slate-300 list-disc list-inside text-[11px]">
                    <li>Discovered statutory compliance delay vs launch urgency</li>
                    <li>Iteratively negotiated phased dual-track compromise</li>
                    <li>Full sentence-level attribution to specialist evidence</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Analytical Synthesis */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <span className="font-bold text-purple-400 uppercase tracking-wider text-[11px] block mb-1.5 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Comparative Evaluation:
              </span>
              <p className="text-slate-200 leading-relaxed">
                {benchmark.analysis_comparison}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

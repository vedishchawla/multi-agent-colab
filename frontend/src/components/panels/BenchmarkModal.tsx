import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
    <Dialog open={isOpen} onOpenChange={open=>{if(!open)onClose();}}><DialogContent className="modal-panel">
      <div className="relative w-full max-w-4xl bg-muted border border-border rounded-md p-6  max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-accent border border-primary/30 flex items-center justify-center text-primary">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                Single-LLM vs CollaborAI Multi-Agent Comparison
              </DialogTitle><DialogDescription className="sr-only">Comparison with a single-model baseline for the same decision.</DialogDescription>
              
            </div>
          </div>

        </div>

        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            <Scale className="w-10 h-10 mx-auto mb-3 animate-spin text-primary" />
            Running monolithic baseline on identical goal & constraints...
          </div>
        ) : benchmark ? (
          <div className="space-y-5">
            {/* Side-by-Side Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Monolithic Single-LLM */}
              <div className="p-4 rounded-md bg-background border border-border text-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-muted" />
                    Single-LLM Baseline (Direct Prompt)
                  </span>
                  <span className="font-mono text-[11px] text-destructive bg-destructive-soft px-2 py-0.5 rounded border border-destructive/30">
                    Depth: {Math.round(benchmark.depth_score_single_llm * 100)}%
                  </span>
                </div>

                <div>
                  <span className="font-semibold text-muted-foreground uppercase text-[11px] block mb-1">
                    Verdict:
                  </span>
                  <div className="text-destructive font-semibold">{benchmark.single_llm_verdict}</div>
                </div>

                <div>
                  <span className="font-semibold text-muted-foreground uppercase text-[11px] block mb-1">
                    Monolithic Response Snippet:
                  </span>
                  <p className="text-foreground italic bg-muted p-2.5 rounded border border-border leading-relaxed">
                    "{benchmark.single_llm_summary}..."
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-destructive uppercase text-[11px] block mb-1 flex items-center gap-1">
                    <AlertOctagon className="w-3.5 h-3.5" />
                    Critical Blindspots & Missed Friction:
                  </span>
                  <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                    {benchmark.single_llm_missed_conflicts.map((m, i) => (
                      <li key={i} className="text-[11px] text-destructive">{m}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right Column: CollaborAI Multi-Agent */}
              <div className="p-4 rounded-md bg-accent border border-primary/30 text-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-primary/30">
                  <span className="font-bold text-primary flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-accent " />
                    CollaborAI Multi-Agent Coordination
                  </span>
                  <span className="font-mono text-[11px] text-success bg-success-soft px-2 py-0.5 rounded border border-success/30 font-bold">
                    Depth: {Math.round(benchmark.depth_score_multi_agent * 100)}%
                  </span>
                </div>

                <div>
                  <span className="font-semibold text-primary uppercase text-[11px] block mb-1">
                    Reconciled Verdict:
                  </span>
                  <div className="text-success font-semibold">{benchmark.multi_agent_verdict}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 rounded bg-muted border border-border">
                    <span className="text-lg font-bold text-destructive block">
                      {benchmark.multi_agent_conflicts_surfaced}
                    </span>
                    <span className="text-[11px] text-muted-foreground uppercase">Conflicts Surfaced</span>
                  </div>
                  <div className="p-2 rounded bg-muted border border-border">
                    <span className="text-lg font-bold text-success block">
                      {benchmark.multi_agent_negotiations_completed}
                    </span>
                    <span className="text-[11px] text-muted-foreground uppercase">Consensus Rounds</span>
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-success uppercase text-[11px] block mb-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Coordination Strengths:
                  </span>
                  <ul className="space-y-1 text-foreground list-disc list-inside text-[11px]">
                    <li>Discovered statutory compliance delay vs launch urgency</li>
                    <li>Iteratively negotiated phased dual-track compromise</li>
                    <li>Full sentence-level attribution to specialist evidence</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Analytical Synthesis */}
            <div className="p-4 rounded-md bg-background border border-border text-xs">
              <span className="font-bold text-primary uppercase tracking-normal text-[11px] block mb-1.5 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Comparative Evaluation:
              </span>
              <p className="text-foreground leading-relaxed">
                {benchmark.analysis_comparison}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </DialogContent></Dialog>
  );
};

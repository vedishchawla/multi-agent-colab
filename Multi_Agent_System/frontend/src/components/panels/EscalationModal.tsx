import React, { useState } from 'react';
import { AlertTriangle, UserCheck, Check, ArrowRight, ShieldAlert } from 'lucide-react';
import { HumanEscalation } from '../../types/schema';

interface EscalationModalProps {
  escalation: HumanEscalation | null;
  isOpen: boolean;
  isSubmitting: boolean;
  onSubmitDecision: (selectedOptionId: string, customGuidance?: string) => void;
  onClose: () => void;
}

export const EscalationModal: React.FC<EscalationModalProps> = ({
  escalation,
  isOpen,
  isSubmitting,
  onSubmitDecision,
  onClose,
}) => {
  const [selectedOption, setSelectedOption] = useState<string>('OPT-A');
  const [customGuidance, setCustomGuidance] = useState<string>('');

  if (!isOpen || !escalation) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOption || isSubmitting) return;
    onSubmitDecision(selectedOption, customGuidance.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-rose-500/50 rounded-2xl p-6 shadow-2xl shadow-rose-500/20 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/70 px-2 py-0.5 rounded border border-rose-800/40">
                {escalation.escalation_id}
              </span>
              <h3 className="text-base font-bold text-slate-100">
                Human Escalation Required: Multi-Agent Deadlock
              </h3>
            </div>
            <p className="text-xs text-rose-300/80 mt-1">
              Autonomous agents reached irreconcilable trade-offs and paused execution. Your strategic decision is required to proceed.
            </p>
          </div>
        </div>

        {/* Reason */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 mb-5 text-xs">
          <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
            Conflict Deadlock Summary:
          </span>
          <p className="text-slate-200 leading-relaxed">{escalation.reason}</p>
        </div>

        {/* Options Selector Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Select Executive Resolution Strategy:
            </label>

            {escalation.options.map((opt) => {
              const isSelected = selectedOption === opt.option_id;

              return (
                <div
                  key={opt.option_id}
                  onClick={() => setSelectedOption(opt.option_id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-rose-950/30 border-rose-500 ring-2 ring-rose-500/30 shadow-lg'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-rose-400 bg-rose-500'
                            : 'border-slate-600 bg-slate-900'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className="text-xs font-bold text-slate-100">
                        {opt.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 font-semibold">
                      {opt.option_id}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 ml-6 mb-2">
                    {opt.description}
                  </p>

                  <div className="ml-6 space-y-1 text-[11px]">
                    <div className="text-slate-400">
                      <strong className="text-rose-400">Trade-offs:</strong>{' '}
                      {opt.trade_offs.join(', ')}
                    </div>
                    <div className="text-emerald-400">
                      <strong>Projected Impact:</strong> {opt.estimated_impact}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom Guidance Textarea */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Additional Executive Guidance (Optional):
            </label>
            <input
              type="text"
              placeholder="e.g. Prioritize safety; marketing campaign budget approved at $30k..."
              value={customGuidance}
              onChange={(e) => setCustomGuidance(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-rose-500 text-xs text-slate-100 outline-none placeholder:text-slate-600"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 transition"
            >
              Review Context Later
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 shadow-lg shadow-rose-600/30 active:scale-95 disabled:opacity-50 transition"
            >
              {isSubmitting ? (
                'Resuming Orchestration...'
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  Inject Decision & Resume Deliberation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

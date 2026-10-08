import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
    <Dialog open={isOpen} onOpenChange={open=>{if(!open)onClose();}}><DialogContent className="modal-panel">
      <div className="relative w-full max-w-2xl bg-muted border border-destructive/30 rounded-md p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4 pb-4 border-b border-border">
          <div className="w-10 h-10 rounded-md bg-destructive-soft border border-destructive/30 flex items-center justify-center text-destructive shrink-0">
            <ShieldAlert className="w-5 h-5 " />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-destructive bg-destructive-soft px-2 py-0.5 rounded border border-destructive/30">
                {escalation.escalation_id}
              </span>
              <DialogTitle className="text-base font-bold text-foreground">
                Human Escalation Required: Multi-Agent Deadlock
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Autonomous agents reached irreconcilable trade-offs and paused execution. Your strategic decision is required to proceed.
            </DialogDescription>
          </div>
        </div>

        {/* Reason */}
        <div className="p-3.5 rounded-md bg-background border border-border mb-5 text-xs">
          <span className="font-semibold text-muted-foreground uppercase tracking-normal text-[11px] block mb-1">
            Conflict Deadlock Summary:
          </span>
          <p className="text-foreground leading-relaxed">{escalation.reason}</p>
        </div>

        {/* Options Selector Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2.5">
            <label className="text-xs font-semibold uppercase tracking-normal text-muted-foreground block">
              Select Executive Resolution Strategy:
            </label>

            {escalation.options.map((opt) => {
              const isSelected = selectedOption === opt.option_id;

              return (
                <div
                  key={opt.option_id}
                  role="radio" aria-checked={isSelected} tabIndex={0} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelectedOption(opt.option_id);}}} onClick={() => setSelectedOption(opt.option_id)}
                  className={`p-4 rounded-md border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-destructive-soft border-destructive/30 ring-2 ring-destructive/30 '
                      : 'bg-background border-border hover:border-border'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-destructive/30 bg-destructive-soft'
                            : 'border-border bg-muted'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 text-foreground" />}
                      </div>
                      <span className="text-xs font-bold text-foreground">
                        {opt.title}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                      {opt.option_id}
                    </span>
                  </div>

                  <p className="text-xs text-foreground ml-6 mb-2">
                    {opt.description}
                  </p>

                  <div className="ml-6 space-y-1 text-[11px]">
                    <div className="text-muted-foreground">
                      <strong className="text-destructive">Trade-offs:</strong>{' '}
                      {opt.trade_offs.join(', ')}
                    </div>
                    <div className="text-success">
                      <strong>Projected Impact:</strong> {opt.estimated_impact}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom Guidance Textarea */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Additional Executive Guidance (Optional):
            </label>
            <input
              type="text"
              placeholder="e.g. Prioritize safety; marketing campaign budget approved at $30k..."
              value={customGuidance}
              onChange={(e) => setCustomGuidance(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-background border border-border focus:border-destructive/30 text-xs text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button variant="ghost"
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground transition"
            >
              Review Context Later
            </Button>
            <Button variant="ghost"
              type="submit"
              disabled={isSubmitting || !escalation.options.some(opt=>opt.option_id===selectedOption)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-md text-xs font-bold text-foreground  -600 -600 -500 -500  disabled:opacity-50 transition"
            >
              {isSubmitting ? (
                'Resuming Orchestration...'
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  Inject Decision & Resume Deliberation
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DialogContent></Dialog>
  );
};

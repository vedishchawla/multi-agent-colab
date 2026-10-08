import { Button } from '@/components/ui/button';
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
      <div className="bg-muted  border border-border rounded-md p-6  text-center py-12 text-muted-foreground text-xs">
        <Award className="w-8 h-8 mx-auto mb-2 opacity-40" />
        Deliberation in progress. Unified recommendation will be synthesized upon conclusion.
      </div>
    );
  }

  const getVerdictBadge = () => {
    switch (recommendation.strategic_verdict) {
      case 'GO':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-normal bg-success-soft text-success border border-success/30">
            Approved to proceed
          </span>
        );
      case 'GO_WITH_CONDITIONS':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-normal bg-accent text-primary border border-primary/30">
            Go with conditions
          </span>
        );
      case 'DEFER':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-normal bg-accent text-primary border border-primary/30">
            Defer — phase gates required
          </span>
        );
      case 'ALTERNATIVE_SELECTED':
        return <span className="text-xs font-semibold text-primary">Alternative selected</span>;
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-normal bg-destructive-soft text-destructive border border-destructive/30">
            Do not proceed
          </span>
        );
    }
  };

  return (
    <div className="panel-content space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-md border border-primary/30 flex items-center justify-center text-primary">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-medium text-foreground">
              Final recommendation
            </h3>
            
          </div>
        </div>
        <div>{getVerdictBadge()}</div>
      </div>

      {/* Executive Summary Narrative */}
      <div className="recommendation-summary">
        <h4 className="text-xs font-bold uppercase tracking-normal text-primary mb-1.5">
          Collective decision
        </h4>
        <p className="recommendation-narrative">
          {recommendation.executive_summary}
        </p>
      </div>

      {/* Phased Roadmap */}
      {recommendation.phased_roadmap && recommendation.phased_roadmap.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-normal text-muted-foreground mb-2.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            Implementation roadmap
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recommendation.phased_roadmap.map((phase, idx) => (
              <div
                key={idx}
                className="roadmap-phase text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between font-bold text-foreground">
                  <span className="text-primary">{phase.phase}</span>
                </div>
                <div className="text-[11px] font-mono text-muted-foreground">
                  Duration: {phase.duration}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Owner: {phase.owner}
                </div>
                {phase.actions && phase.actions.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 text-foreground pt-1 text-[11px]">
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
          <h4 className="text-xs font-bold uppercase tracking-normal text-muted-foreground mb-2.5 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-success" />
            Risks & safeguards
          </h4>
          <div className="space-y-2">
            {recommendation.risk_mitigation_plan.map((risk, idx) => (
              <div
                key={idx}
                className="p-3 rounded-md bg-background border border-border text-xs flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-[200px]">
                  <span className="font-semibold text-destructive block mb-0.5">
                    {risk.risk}
                  </span>
                  <span className="text-muted-foreground text-[11px]">
                    {risk.mitigation}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted border border-border text-muted-foreground block mb-1">
                    Severity: {risk.severity}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
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

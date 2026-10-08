import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import {
  FileText,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Finding } from '../../types/schema';

interface BlackboardPanelProps {
  findings: Finding[];
  highlightedFindingIds?: string[];
  onSelectFinding?: (findingId: string) => void;
}

export const BlackboardPanel: React.FC<BlackboardPanelProps> = ({
  findings,
  highlightedFindingIds = [],
  onSelectFinding,
}) => {
  const [filterAgent, setFilterAgent] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Extract unique agent names
  const agents = ['ALL', ...Array.from(new Set(findings.map((f) => f.agent_name)))];

  const filtered = findings.filter((f) => {
    if (filterAgent !== 'ALL' && f.agent_name !== filterAgent) return false;
    if (filterStatus !== 'ALL' && f.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="panel-content flex flex-col h-full">
      {/* Header & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent border border-primary/30 flex items-center justify-center text-primary">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              Shared findings
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
                {findings.length} findings
              </span>
            </h3>
            
          </div>
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1 bg-background px-2.5 py-1.5 rounded-lg border border-border">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              aria-label="Filter findings by agent" value={filterAgent}
              onChange={(e) => setFilterAgent(e.target.value)}
              className="bg-transparent text-foreground outline-none cursor-pointer"
            >
              {agents.map((a) => (
                <option key={a} value={a} className="bg-muted text-foreground">
                  {a === 'ALL' ? 'All Agents' : a}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-background px-2.5 py-1.5 rounded-lg border border-border">
            <select
              aria-label="Filter findings by status" value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-foreground outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-muted text-foreground">All Statuses</option>
              <option value="active" className="bg-muted text-foreground">Active</option>
              <option value="revised" className="bg-muted text-foreground">Revised</option>
              <option value="stale" className="bg-muted text-foreground">Stale</option>
            </select>
          </div>
        </div>
      </div>

      {/* Findings Ledger List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[500px]">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-xs">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            No findings posted yet. Start a deliberation to see intermediate specialist outputs.
          </div>
        ) : (
          filtered.map((finding) => {
            const isHighlighted = highlightedFindingIds.includes(finding.finding_id);
            const isRevised = finding.status === 'revised';
            const isStale = finding.status === 'stale';

            return (
              <div
                key={finding.finding_id}
                onClick={() => onSelectFinding?.(finding.finding_id)}
                className={`p-3.5 rounded-xl bg-card border cursor-pointer ${
                  isHighlighted
                    ? 'border-primary/30 bg-accent ring-2 ring-primary/30'
                    : isRevised
                    ? 'border-success/30 hover:border-success/30'
                    : isStale
                    ? 'border-primary/30 opacity-75'
                    : 'border-border hover:border-border'
                }`}
              >
                {/* Finding Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] font-bold text-primary bg-accent px-2 py-0.5 rounded border border-primary/30">
                      {finding.finding_id}
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      {finding.agent_name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">• {finding.topic}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isRevised ? (
                      <span className="text-[11px] font-semibold text-success bg-success-soft px-2 py-0.5 rounded border border-success/30 flex items-center gap-1">
                        <CheckCircle className="w-2.5 h-2.5" /> Revised
                      </span>
                    ) : isStale ? (
                      <span className="text-[11px] font-semibold text-primary bg-accent px-2 py-0.5 rounded border border-primary/30 flex items-center gap-1">
                        <AlertCircle className="w-2.5 h-2.5" /> Stale
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        Active
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {Math.round(finding.confidence * 100)}% conf
                    </span>
                  </div>
                </div>

                {/* Claim Statement */}
                <p className="text-xs text-foreground mb-2 leading-relaxed font-medium">
                  {finding.claim}
                </p>

                {/* Quantitative Assertions */}
                {finding.assertions && finding.assertions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {finding.assertions.map((a, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-muted border border-border text-foreground"
                      >
                        <span className="text-muted-foreground">
                          {a.dimension_label || a.dimension}:
                        </span>
                        <span className="font-semibold text-primary">
                          {String(a.value)} {a.unit || ''}
                        </span>
                        {a.is_flexible && (
                          <span className="text-[10px] text-success bg-success-soft px-1 rounded">
                            flexible
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Assumptions */}
                {finding.assumptions && finding.assumptions.length > 0 && (
                  <div className="text-[11px] text-muted-foreground bg-muted p-2 rounded-lg border border-border">
                    <span className="font-semibold text-muted-foreground uppercase tracking-normal text-[11px] block mb-0.5">
                      Assumptions:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                      {finding.assumptions.map((asm, i) => (
                        <li key={i} className="line-clamp-1">{asm}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

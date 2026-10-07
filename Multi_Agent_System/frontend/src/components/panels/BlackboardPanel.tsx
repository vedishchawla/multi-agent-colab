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
    <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full">
      {/* Header & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Shared State Blackboard
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                {findings.length} findings
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Live ledger of specialist evidence and quantitative assertions
            </p>
          </div>
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={filterAgent}
              onChange={(e) => setFilterAgent(e.target.value)}
              className="bg-transparent text-slate-300 outline-none cursor-pointer"
            >
              {agents.map((a) => (
                <option key={a} value={a} className="bg-slate-900 text-slate-200">
                  {a === 'ALL' ? 'All Agents' : a}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-slate-300 outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-slate-200">All Statuses</option>
              <option value="active" className="bg-slate-900 text-slate-200">Active</option>
              <option value="revised" className="bg-slate-900 text-slate-200">Revised</option>
              <option value="stale" className="bg-slate-900 text-slate-200">Stale</option>
            </select>
          </div>
        </div>
      </div>

      {/* Findings Ledger List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[500px]">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
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
                className={`p-3.5 rounded-xl bg-slate-950/70 border transition-all duration-200 cursor-pointer ${
                  isHighlighted
                    ? 'border-cyan-400 bg-cyan-950/20 ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-500/10'
                    : isRevised
                    ? 'border-emerald-500/40 hover:border-emerald-500'
                    : isStale
                    ? 'border-amber-500/40 opacity-75'
                    : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Finding Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                      {finding.finding_id}
                    </span>
                    <span className="text-xs font-semibold text-slate-200">
                      {finding.agent_name}
                    </span>
                    <span className="text-[11px] text-slate-500">• {finding.topic}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isRevised ? (
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle className="w-2.5 h-2.5" /> Revised
                      </span>
                    ) : isStale ? (
                      <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                        <AlertCircle className="w-2.5 h-2.5" /> Stale
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                        Active
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-slate-400">
                      {Math.round(finding.confidence * 100)}% conf
                    </span>
                  </div>
                </div>

                {/* Claim Statement */}
                <p className="text-xs text-slate-200 mb-2 leading-relaxed font-medium">
                  {finding.claim}
                </p>

                {/* Quantitative Assertions */}
                {finding.assertions && finding.assertions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {finding.assertions.map((a, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
                      >
                        <span className="text-slate-500">
                          {a.dimension_label || a.dimension}:
                        </span>
                        <span className="font-semibold text-cyan-300">
                          {String(a.value)} {a.unit || ''}
                        </span>
                        {a.is_flexible && (
                          <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1 rounded">
                            flexible
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Assumptions */}
                {finding.assumptions && finding.assumptions.length > 0 && (
                  <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800/40">
                    <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block mb-0.5">
                      Assumptions:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-400">
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

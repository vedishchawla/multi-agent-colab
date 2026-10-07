import React from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  TrendingUp,
  ShieldCheck,
  DollarSign,
  Crosshair,
  Cpu,
  Lock,
  Activity,
  HeartPulse,
  Sparkles,
  Bot,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Compass,
} from 'lucide-react';
import { AgentStatus, SpecialistProfile } from '../../types/schema';

// Icon resolver helper
export function getAgentIcon(iconName: string = 'Bot', className: string = 'w-5 h-5') {
  switch (iconName.toLowerCase()) {
    case 'trendingup':
      return <TrendingUp className={className} />;
    case 'shieldcheck':
      return <ShieldCheck className={className} />;
    case 'dollarsign':
      return <DollarSign className={className} />;
    case 'crosshair':
      return <Crosshair className={className} />;
    case 'cpu':
      return <Cpu className={className} />;
    case 'lock':
      return <Lock className={className} />;
    case 'activity':
      return <Activity className={className} />;
    case 'heartpulse':
      return <HeartPulse className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'compass':
      return <Compass className={className} />;
    default:
      return <Bot className={className} />;
  }
}

interface AgentNodeProps {
  data: {
    agent: SpecialistProfile;
    status?: AgentStatus;
    findingsCount?: number;
    isHighlighted?: boolean;
    inConflict?: boolean;
  };
}

export const AgentNode: React.FC<AgentNodeProps> = ({ data }) => {
  const { agent, status, findingsCount = 0, isHighlighted, inConflict } = data;
  const state = status?.state || 'idle';

  // Status visual configurations
  const getStatusBadge = () => {
    switch (state) {
      case 'thinking':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
            Analyzing
          </span>
        );
      case 'posting_finding':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Posting Finding
          </span>
        );
      case 'debating':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            Debating
          </span>
        );
      case 'waiting_human':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            Awaiting Human
          </span>
        );
      case 'resolved':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Consensus Aligned
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
            <Clock className="w-3 h-3" />
            Standby
          </span>
        );
    }
  };

  const getBorderGlow = () => {
    if (isHighlighted) return 'ring-4 ring-cyan-400 border-cyan-400 shadow-xl shadow-cyan-500/30 scale-105';
    if (inConflict) return 'ring-2 ring-rose-500 border-rose-500 shadow-lg shadow-rose-500/20';
    if (state === 'thinking') return 'ring-2 ring-blue-500/70 border-blue-500 shadow-lg shadow-blue-500/20';
    if (state === 'debating') return 'ring-2 ring-amber-500/70 border-amber-500 shadow-lg shadow-amber-500/20';
    if (state === 'resolved') return 'border-emerald-500/50 shadow-sm shadow-emerald-500/10';
    return 'border-slate-800 hover:border-slate-700';
  };

  return (
    <div
      className={`relative w-72 rounded-xl bg-slate-900/90 backdrop-blur-md p-4 transition-all duration-300 border ${getBorderGlow()}`}
    >
      {/* Top and Bottom Connection Handles */}
      <Handle type="target" position={Position.Top} className="!bg-cyan-500 !w-3 !h-3 !border-slate-900" />
      <Handle type="source" position={Position.Bottom} className="!bg-cyan-500 !w-3 !h-3 !border-slate-900" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-rose-500 !w-3 !h-3 !border-slate-900" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-rose-500 !w-3 !h-3 !border-slate-900" />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-inner"
            style={{
              backgroundColor: `${agent.color_theme || '#3b82f6'}20`,
              color: agent.color_theme || '#3b82f6',
              border: `1px solid ${agent.color_theme || '#3b82f6'}40`,
            }}
          >
            {getAgentIcon(agent.avatar_icon)}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100 leading-tight line-clamp-1">
              {agent.role_title}
            </h4>
            <p className="text-[11px] text-slate-400 line-clamp-1">{agent.domain}</p>
          </div>
        </div>
      </div>

      {/* Status & Findings Count */}
      <div className="flex items-center justify-between gap-2 mb-2 pt-2 border-t border-slate-800/80">
        <div>{getStatusBadge()}</div>
        <div className="text-[11px] font-mono text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/50">
          {findingsCount} {findingsCount === 1 ? 'finding' : 'findings'}
        </div>
      </div>

      {/* Action Subtext */}
      {status?.last_action && (
        <div className="text-[11px] text-slate-300/80 line-clamp-2 bg-slate-950/50 p-1.5 rounded border border-slate-800/50 italic">
          "{status.last_action}"
        </div>
      )}
    </div>
  );
};

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
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-[#f2ddd5] text-[#8f3e25] border border-[#d99c88] animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#b95432]" />
            Analyzing
          </span>
        );
      case 'posting_finding':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-[#e7ede5] text-[#456553] border border-[#aec1b2]">
            <CheckCircle2 className="w-3 h-3" />
            Posting Finding
          </span>
        );
      case 'debating':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-[#f5ead5] text-[#8a5c1e] border border-[#dfc087] animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            Debating
          </span>
        );
      case 'waiting_human':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-[#f2dfdd] text-[#a64840] border border-[#d7a39d] animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            Awaiting Human
          </span>
        );
      case 'resolved':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-[#e7ede5] text-[#456553] border border-[#aec1b2]">
            <CheckCircle2 className="w-3 h-3" />
            Consensus Aligned
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-[#f1ece3] text-[#756e64] border border-[#ded6c8]">
            <Clock className="w-3 h-3" />
            Standby
          </span>
        );
    }
  };

  const getBorderGlow = () => {
    if (isHighlighted) return 'ring-2 ring-[#d99c88] border-[#b95432]';
    if (inConflict) return 'ring-2 ring-[#d7a39d] border-[#a64840]';
    if (state === 'thinking') return 'ring-2 ring-[#d99c88] border-[#b95432]';
    if (state === 'debating') return 'ring-2 ring-[#dfc087] border-[#a16a20]';
    if (state === 'resolved') return 'border-[#aec1b2]';
    return 'border-[#ded6c8] hover:border-[#bfb5a6]';
  };

  return (
    <div
      className={`relative w-72 rounded-lg bg-[#fffdf8] p-4 transition-all duration-300 border ${getBorderGlow()}`}
    >
      {/* Top and Bottom Connection Handles */}
      <Handle type="target" position={Position.Top} className="!bg-[#b95432] !w-2.5 !h-2.5 !border-[#fffdf8]" />
      <Handle type="source" position={Position.Bottom} className="!bg-[#b95432] !w-2.5 !h-2.5 !border-[#fffdf8]" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-[#a64840] !w-2.5 !h-2.5 !border-[#fffdf8]" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-[#a64840] !w-2.5 !h-2.5 !border-[#fffdf8]" />

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
            <h4 className="text-sm font-semibold text-[#25231f] leading-tight line-clamp-1">
              {agent.role_title}
            </h4>
            <p className="text-[11px] text-[#756e64] line-clamp-1">{agent.domain}</p>
          </div>
        </div>
      </div>

      {/* Status & Findings Count */}
      <div className="flex items-center justify-between gap-2 mb-2 pt-2 border-t border-[#ded6c8]">
        <div>{getStatusBadge()}</div>
        <div className="text-[11px] font-mono text-[#756e64] bg-[#f7f2e9] px-2 py-0.5 rounded border border-[#ded6c8]">
          {findingsCount} {findingsCount === 1 ? 'finding' : 'findings'}
        </div>
      </div>

      {/* Action Subtext */}
      {status?.last_action && (
        <div className="text-[11px] text-[#625d54] line-clamp-2 bg-[#f7f2e9] p-1.5 rounded border border-[#e6ded1] italic">
          "{status.last_action}"
        </div>
      )}
    </div>
  );
};

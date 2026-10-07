import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  MarkerType,
} from '@xyflow/react';
import { SharedState } from '../../types/schema';
import { AgentNode } from './AgentNode';

const nodeTypes = {
  agentNode: AgentNode,
};

interface AgentGraphViewProps {
  state: SharedState | null;
  highlightedAgents?: string[];
}

export const AgentGraphView: React.FC<AgentGraphViewProps> = ({
  state,
  highlightedAgents = [],
}) => {
  const specialists = state?.active_specialists || [];
  const conflicts = state?.conflicts || [];
  const findings = state?.findings || [];
  const agentStatuses = state?.agent_statuses || {};

  // Compute React Flow Nodes dynamically
  const nodes: Node[] = useMemo(() => {
    if (!specialists.length) {
      return [
        {
          id: 'placeholder',
          position: { x: 350, y: 150 },
          data: { label: 'Awaiting Run Initialization...' },
          type: 'default',
          style: {
            background: '#0f172a',
            color: '#64748b',
            border: '1px dashed #334155',
            borderRadius: '12px',
            padding: '24px',
            fontSize: '14px',
          },
        },
      ];
    }

    const total = specialists.length;
    const centerX = 360;
    const centerY = 190;
    const radiusX = 320;
    const radiusY = 160;

    return specialists.map((spec, index) => {
      // Position nodes in an ellipse around the blackboard center
      const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + radiusX * Math.cos(angle) - 144;
      const y = centerY + radiusY * Math.sin(angle) - 60;

      const findingsCount = findings.filter(
        (f) => f.agent_name.toLowerCase() === spec.agent_name.toLowerCase()
      ).length;

      const inConflict = conflicts.some(
        (c) =>
          c.status !== 'resolved' &&
          c.agents_involved.some((a) => a.toLowerCase() === spec.agent_name.toLowerCase())
      );

      const isHighlighted = highlightedAgents.some(
        (a) => a.toLowerCase() === spec.agent_name.toLowerCase()
      );

      return {
        id: spec.agent_name,
        type: 'agentNode',
        position: { x, y },
        data: {
          agent: spec,
          status: agentStatuses[spec.agent_name],
          findingsCount,
          inConflict,
          isHighlighted,
        },
      };
    });
  }, [specialists, agentStatuses, findings, conflicts, highlightedAgents]);

  // Compute React Flow Edges
  const edges: Edge[] = useMemo(() => {
    const list: Edge[] = [];

    // 1. Conflict edges (bold red animated tension lines between conflicting agents)
    conflicts.forEach((conflict) => {
      const isResolved = conflict.status === 'resolved';
      for (let i = 0; i < conflict.agents_involved.length - 1; i++) {
        const source = conflict.agents_involved[i];
        const target = conflict.agents_involved[i + 1];

        list.push({
          id: `conflict-${conflict.conflict_id}-${i}`,
          source,
          target,
          sourceHandle: 'right',
          targetHandle: 'left',
          label: i === 0 ? (isResolved ? '✓ Compromise Reached' : `⚡ ${conflict.conflict_type.replace('_', ' ')}`) : undefined,
          animated: !isResolved,
          style: {
            stroke: isResolved ? '#10b981' : '#f43f5e',
            strokeWidth: isResolved ? 2.5 : 3.5,
            strokeDasharray: isResolved ? undefined : '5,5',
          },
          labelStyle: {
            fill: isResolved ? '#34d399' : '#fb7185',
            fontWeight: 700,
            fontSize: 11,
          },
          labelBgStyle: {
            fill: '#0f172a',
            fillOpacity: 0.95,
            stroke: isResolved ? '#059669' : '#e11d48',
            strokeWidth: 1,
            rx: 6,
            ry: 6,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isResolved ? '#10b981' : '#f43f5e',
          },
        });
      }
    });

    // 2. Inter-agent communication / findings sharing edges
    findings.forEach((finding, idx) => {
      if (finding.dependencies && finding.dependencies.length) {
        const targetAgent = finding.agent_name;
        finding.dependencies.forEach((dep) => {
          list.push({
            id: `dep-${idx}-${dep}`,
            source: dep,
            target: targetAgent,
            animated: true,
            style: { stroke: '#0284c7', strokeWidth: 1.5, opacity: 0.5 },
          });
        });
      }
    });

    return list;
  }, [conflicts, findings]);

  return (
    <div className="relative w-full h-[420px] rounded-2xl bg-slate-950/80 border border-slate-800/80 overflow-hidden shadow-2xl">
      {/* Visual Badge overlay */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-medium text-slate-300">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        Live Multi-Agent Coordination Mesh
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
        className="bg-dot-grid"
      >
        <Background color="#1e293b" gap={20} size={1} />
        <Controls className="!border-slate-800 !bg-slate-900/90 !rounded-lg overflow-hidden" />
      </ReactFlow>
    </div>
  );
};

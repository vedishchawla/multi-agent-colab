import React from 'react';
import { Users, Bot, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { SpecialistProfile, AgentStatus, Task } from '../../types/schema';
import { getAgentIcon } from '../graph/AgentNode';

interface AgentTeamPanelProps {
  specialists: SpecialistProfile[];
  statuses: Record<string, AgentStatus>;
  tasks: Task[];
}

export const AgentTeamPanel: React.FC<AgentTeamPanelProps> = ({
  specialists,
  statuses,
  tasks,
}) => {
  return (
    <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Activated Specialist Team
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                {specialists.length} specialists
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Autonomous domain agents assigned to active workstreams
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {specialists.length === 0 ? (
          <div className="col-span-full text-center py-6 text-slate-500 text-xs">
            No specialists activated yet. Launch a run to assemble the team.
          </div>
        ) : (
          specialists.map((spec) => {
            const status = statuses[spec.agent_name];
            const state = status?.state || 'idle';
            const agentTasks = tasks.filter(
              (t) => t.assigned_agent.toLowerCase() === spec.agent_name.toLowerCase()
            );

            return (
              <div
                key={spec.agent_name}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition space-y-2"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${spec.color_theme || '#3b82f6'}20`,
                      color: spec.color_theme || '#3b82f6',
                    }}
                  >
                    {getAgentIcon(spec.avatar_icon, 'w-4 h-4')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-100 truncate">
                      {spec.role_title}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate">{spec.domain}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800/50">
                  <span className="text-slate-400 font-mono capitalize">
                    {state.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono">
                    {agentTasks.length} {agentTasks.length === 1 ? 'task' : 'tasks'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

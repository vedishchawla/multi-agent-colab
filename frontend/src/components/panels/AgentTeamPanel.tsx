import { Button } from '@/components/ui/button';
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
    <div className="panel-content ">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent border border-primary/30 flex items-center justify-center text-primary">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              Agent team
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
                {specialists.length} specialists
              </span>
            </h3>
            
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {specialists.length === 0 ? (
          <div className="col-span-full text-center py-6 text-muted-foreground text-xs">
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
                className="p-3.5 rounded-xl bg-card border border-border space-y-2 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`agent-avatar domain-${spec.domain.toLowerCase().replace(/[^a-z]/g,'')} w-8 h-8 rounded-lg flex items-center justify-center shrink-0`}
                  >
                    {getAgentIcon(spec.avatar_icon, 'w-4 h-4')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-foreground truncate">
                      {spec.role_title}
                    </h4>
                    <p className="text-[11px] text-muted-foreground truncate">{spec.domain}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-border">
                  <span className="text-muted-foreground font-mono capitalize">
                    {state.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-primary font-mono">
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

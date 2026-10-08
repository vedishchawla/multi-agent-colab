import { Handle, Position } from '@xyflow/react';
import { formatLocalTime } from '@/lib/utils';
import { TrendingUp, ShieldCheck, DollarSign, Crosshair, Cpu, Lock, Activity, HeartPulse, Compass, Bot, ArrowUpRight, Check, Loader2, AlertTriangle, Clock } from 'lucide-react';
import type { AgentStatus, SpecialistProfile } from '@/types/schema';
import { statusLabels, statusTone, agentLabel } from './agent-presentation';
export function getAgentIcon(name='Bot', className='size-4') { const icons: Record<string, typeof Bot> = {trendingup:TrendingUp,shieldcheck:ShieldCheck,dollarsign:DollarSign,crosshair:Crosshair,cpu:Cpu,lock:Lock,activity:Activity,heartpulse:HeartPulse,compass:Compass};const Icon=icons[name.toLowerCase()]||Bot;return <Icon className={className}/>; }
interface Props { data: { agent: SpecialistProfile; status?: AgentStatus; findingsCount?: number; isHighlighted?: boolean; inConflict?: boolean; latestFinding?: string; confidence?: number; task?: string; }; }
export function AgentNode({data}:Props) { const {agent,status,findingsCount=0,isHighlighted,inConflict}=data; const state=status?.state||'idle';const Icon=state==='resolved'?Check:state==='thinking'||state==='re_evaluating'?Loader2:inConflict||state==='waiting_human'||state==='error'?AlertTriangle:state==='posting_finding'?ArrowUpRight:Clock;
 return <div className={`agent-node ${isHighlighted?'spotlight':''} ${inConflict?'in-conflict':''} ${state==='thinking'||state==='re_evaluating'?'is-thinking':''}`} tabIndex={0} aria-label={`${agent.role_title}, ${statusLabels[state]}, ${findingsCount} findings`}>
 <Handle type="target" position={Position.Top}/><Handle type="source" position={Position.Bottom}/><Handle type="target" position={Position.Left} id="left"/><Handle type="source" position={Position.Right} id="right"/>
 <div className="flex items-center gap-2.5"><span className={`agent-avatar domain-${agent.domain.toLowerCase().replace(/[^a-z]/g,'')}`}>{getAgentIcon(agent.avatar_icon)}</span><div className="min-w-0"><h4 className="text-xs font-semibold truncate">{agentLabel(agent.agent_name)}</h4><p className="text-[10px] text-muted-foreground truncate mt-0.5">{agent.domain}</p></div></div>
 <div className="flex justify-between gap-2 mt-3 pt-2.5 border-t border-border"><span className={`node-status tone-${statusTone(state)}`}><Icon size={10}/>{inConflict?'Conflict':statusLabels[state]}</span><span className="text-[10px] text-muted-foreground">{findingsCount} findings</span></div>
 <div className="node-context"><p>{data.task||status?.last_action||'Awaiting assignment'}</p>{data.latestFinding&&<p className="mt-2">{data.latestFinding}</p>}{data.confidence!==undefined&&<p className="mt-2">{Math.round(data.confidence*100)}% confidence</p>}{status?.updated_at&&<time className="block mt-2">Updated {formatLocalTime(status.updated_at)}</time>}</div>
 </div>;
}

import { useMemo, useState, useEffect, useRef } from 'react';
import { ReactFlow, Background, Controls, Handle, Position, type Node, type Edge, type NodeProps, type EdgeProps, BaseEdge, getSmoothStepPath, useReactFlow, ReactFlowProvider } from '@xyflow/react';
import { Plus, Minus, Maximize, Layers, GitBranch, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import type { SharedState } from '@/types/schema';
import { AgentNode } from './AgentNode';

function LayerNode({data}:NodeProps) {return <div className={`layer-node ${data['kind']==='knowledge'?'knowledge-node':''}`}><Handle type="target" position={Position.Top}/><Handle type="source" position={Position.Bottom}/><span className="layer-icon">{data['kind']==='knowledge'?<Layers size={18}/>:<GitBranch size={18}/>}</span><div><p className="text-xs font-semibold">{String(data['label'])}</p><p className="text-[10px] text-muted-foreground mt-1">{String(data['subtitle'])}</p></div>{data['kind']==='knowledge'&&<span className="knowledge-mark">+</span>}</div>}
function WaitingNode({data}:NodeProps) {return <div className="waiting-node"><Handle type="target" position={Position.Top}/><Handle type="source" position={Position.Bottom}/><span className="waiting-symbol">{String(data['number'])}</span><span className="text-xs">Specialist agent</span><span className="text-[10px] text-muted-foreground">Awaiting assignment</span></div>}
function SignalEdge(props:EdgeProps) {
 const [path]=getSmoothStepPath(props);
 const active=props.animated;
 return <><BaseEdge id={props.id} path={path}/>{active&&<circle r="2.5" className="knowledge-signal"><animateMotion dur="2.4s" repeatCount="indefinite" path={path}/></circle>}</>;
}
const edgeTypes={signal:SignalEdge};
const nodeTypes={agentNode:AgentNode,layer:LayerNode,waiting:WaitingNode};
function GraphControls(){
 const {zoomIn,zoomOut,fitView}=useReactFlow();
 const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const canvas=ref.current?.closest('.collaboration-canvas');
  if(!canvas)return;
  let timer: any;
  const observer=new ResizeObserver(()=>{
   clearTimeout(timer);
   timer=setTimeout(()=>{
    fitView({padding:.18,duration:200});
   },150);
  });
  observer.observe(canvas);
  return ()=>{
   clearTimeout(timer);
   observer.disconnect();
  };
 },[fitView]);
 return <div ref={ref} className="graph-controls"><Button variant="ghost" size="icon" title="Zoom in" aria-label="Zoom in" onClick={()=>zoomIn()}><Plus/></Button><Button variant="ghost" size="icon" title="Zoom out" aria-label="Zoom out" onClick={()=>zoomOut()}><Minus/></Button><span/><Button variant="ghost" size="icon" title="Fit collaboration network" aria-label="Fit collaboration network" onClick={()=>fitView({padding:.18})}><Maximize/></Button></div>;
}

export function AgentGraphView({state,highlightedAgents=[]}:{state:SharedState|null;highlightedAgents?:string[]}) {
 const isMobile=useIsMobile();
 const [hovered,setHovered]=useState<string|null>(null);

 const nodes=useMemo(()=>{
  const specs=state?.active_specialists||[];const count=Math.max(specs.length,4);const columns=isMobile?2:count;const width=columns*212;const center=width/2-96;const knowledgeY=isMobile?150+Math.ceil(count/columns)*135:290;
  const nodesList:Node[]=[{id:'orchestrator',type:'layer',position:{x:center,y:0},data:{label:'Orchestrator',subtitle:state?'Decomposing & coordinating':'Goal decomposition & coordination',kind:'orchestrator'}},{id:'knowledge',type:'layer',position:{x:center-20,y:knowledgeY},data:{label:'Shared knowledge',subtitle:`${state?.findings.length||0} findings · ${state?.conflicts.filter(c=>c.status==='resolved').length||0} resolved conflicts`,kind:'knowledge'}}];
  (specs.length?specs:Array.from({length:4},(_,i)=>({agent_name:`waiting-${i}`}))).forEach((spec,i)=>{
   const full=specs.find(s=>s.agent_name===spec.agent_name);const findings=state?.findings.filter(f=>f.agent_name.toLowerCase()===spec.agent_name.toLowerCase())||[];const status=state?.agent_statuses[spec.agent_name];
   nodesList.push({id:spec.agent_name,type:full?'agentNode':'waiting',position:{x:(i%columns)*212,y:135+Math.floor(i/columns)*135},data:full?{agent:full,status,findingsCount:findings.length,latestFinding:findings.at(-1)?.claim,confidence:findings.at(-1)?.confidence,task:state?.tasks.find(t=>t.task_id===status?.active_task_id)?.objective,isHighlighted:highlightedAgents.some(name=>name.toLowerCase()===spec.agent_name.toLowerCase()),inConflict:state?.conflicts.some(c=>c.status!=='resolved'&&c.agents_involved.some(name=>name.toLowerCase()===spec.agent_name.toLowerCase()))}:{number:`0${i+1}`}});
  });
  return nodesList;
 },[state,highlightedAgents,isMobile]);

 const edges=useMemo(()=>{
  const specs=state?.active_specialists||[];
  const edgesList:Edge[]=[];
  (specs.length?specs:Array.from({length:4},(_,i)=>({agent_name:`waiting-${i}`}))).forEach((spec,i)=>{
   const status=state?.agent_statuses[spec.agent_name];
   const sharing=status?.state==='posting_finding'||status?.state==='thinking';
   edgesList.push({id:`coordinate-${i}`,source:'orchestrator',target:spec.agent_name,type:'smoothstep',className:hovered===spec.agent_name?'edge-hover':''},{id:`share-${i}`,source:spec.agent_name,target:'knowledge',type:'signal',animated:sharing,className:sharing?'edge-sharing':hovered===spec.agent_name?'edge-hover':''});
  });
  state?.conflicts.forEach(c=>{c.agents_involved.slice(0,-1).forEach((source,i)=>{const target=c.agents_involved[i+1];if(!target)return;edgesList.push({id:`conflict-${c.conflict_id}-${i}`,source,target,sourceHandle:'right',targetHandle:'left',type:'smoothstep',animated:c.status==='negotiating',label:c.status==='resolved'?'Resolved':'Conflict',className:c.status==='resolved'?'edge-resolved':'edge-conflict'});});});
  state?.findings.forEach(f=>f.dependencies.forEach(dep=>{const origin=state.findings.find(item=>item.finding_id===dep)?.agent_name||(specs.some(s=>s.agent_name===dep)?dep:undefined);if(origin&&origin!==f.agent_name) edgesList.push({id:`dependency-${f.finding_id}-${dep}`,source:'knowledge',target:f.agent_name,type:'signal',animated:state.agent_statuses[f.agent_name]?.state==='re_evaluating',className:'edge-dependency'});}));
  return edgesList;
 },[state,hovered]);
 return <div className="collaboration-canvas"><div className="canvas-label"><span className={`status-dot ${state&&!state.is_completed?'active-dot':''}`}/>{state?(state.is_completed?'Deliberation complete':'Live collaboration'):'Ready to collaborate'}</div><ReactFlowProvider><ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} fitView fitViewOptions={{padding:.18}} minZoom={.35} maxZoom={1.4} nodesDraggable={false} nodesConnectable={false} onNodeMouseEnter={(_,node)=>setHovered(node.id)} onNodeMouseLeave={()=>setHovered(null)} proOptions={{hideAttribution:true}}><Background gap={22} size={1}/><GraphControls/></ReactFlow></ReactFlowProvider><div className="canvas-legend"><span><i className="legend-line"/>Coordination</span><span><i className="legend-line sharing"/>Knowledge sharing</span><span><i className="legend-dot"/>Conflict</span></div></div>
}

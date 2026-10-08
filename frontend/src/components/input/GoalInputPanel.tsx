import { useState, type FormEvent } from 'react';
import { ArrowUpRight, ArrowRight, Plus, X, ChevronDown, Loader2, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMagnetic } from '@/hooks/useMagnetic';
import type { Constraint, ScenarioPreset } from '@/types/schema';

interface Props { scenarios: ScenarioPreset[]; isLoading: boolean; onStartRun: (params: { goal: string; constraints: Constraint[]; scenario_id?: string; simulation_mode: boolean }) => void; }
export function GoalInputPanel({ scenarios, isLoading, onStartRun }: Props) {
 const [goal, setGoal] = useState('Should we launch Product Y in Brazil next quarter?');
 const [constraints, setConstraints] = useState<Constraint[]>([
  { constraint_id: 'CST-01', category: 'timeline', description: 'Target commercial rollout within 12 weeks', is_hard_constraint: false },
  { constraint_id: 'CST-02', category: 'compliance', description: 'Mandatory ANATEL statutory certification before retail launch', is_hard_constraint: true },
 ]);
 const [simulationMode, setSimulationMode] = useState(false);
 const [editingConstraints, setEditingConstraints] = useState(false);
 const [newDescription, setNewDescription] = useState('');
 const [category, setCategory] = useState<Constraint['category']>('operational');
 const [hard, setHard] = useState(true);
 const magnet = useMagnetic<HTMLButtonElement>(0.16);
 function submit(e: FormEvent) { e.preventDefault(); if (goal.trim() && !isLoading) onStartRun({goal: goal.trim(), constraints, simulation_mode: simulationMode}); }
 function addConstraint() { if (!newDescription.trim()) return; setConstraints([...constraints, {constraint_id: `CST-${Date.now()}`, category, description: newDescription.trim(), is_hard_constraint: hard}]); setNewDescription(''); }
 return <aside className="goal-panel">
  <div className="section-kicker"><span>01 / THE QUESTION</span><ArrowUpRight size={15}/></div>
  <h2 className="text-xl font-medium mt-5 mb-2">A shared goal.</h2>
  <p className="text-sm text-muted-foreground leading-relaxed mb-6">One decision. Multiple perspectives.</p>
  <form onSubmit={submit}>
   <label htmlFor="decision-goal" className="field-label">DECISION GOAL</label>
   <textarea id="decision-goal" rows={4} value={goal} onChange={e=>setGoal(e.target.value)} className="goal-input" placeholder="What decision are you working through?" />
   {scenarios.length > 0 && <div className="mt-5"><label htmlFor="scenario" className="field-label">SCENARIO</label><div className="relative"><select id="scenario" className="field w-full appearance-none pr-8" defaultValue="" onChange={e=>{const sc=scenarios.find(s=>s.scenario_id===e.target.value);if(sc){setGoal(sc.default_goal);setConstraints(sc.default_constraints);}}}><option value="" disabled>Choose a preset</option>{scenarios.map(sc=><option key={sc.scenario_id} value={sc.scenario_id}>{sc.title}</option>)}</select><ChevronDown className="absolute right-3 top-3 pointer-events-none" size={14}/></div></div>}
   <div className="flex items-center justify-between mt-7 mb-3"><span className="field-label mb-0">CONSTRAINTS <span className="text-muted-foreground ml-1">{String(constraints.length).padStart(2,'0')}</span></span><Button type="button" variant="ghost" size="icon" title="Edit constraints" aria-label="Edit constraints" aria-expanded={editingConstraints} onClick={()=>setEditingConstraints(!editingConstraints)} className="size-7"><SlidersHorizontal size={14}/></Button></div>
   <div className="constraint-list">{constraints.map(c=><div key={c.constraint_id} className="constraint-item"><div className="flex items-center justify-between gap-2"><span className={`constraint-type ${c.is_hard_constraint?'text-primary':'text-muted-foreground'}`}>{c.category} <span className="ml-1 text-muted-foreground">/ {c.is_hard_constraint?'required':'flexible'}</span></span>{editingConstraints&&<Button size="icon" type="button" variant="ghost" className="size-6" aria-label={`Remove ${c.description}`} onClick={()=>setConstraints(constraints.filter(item=>item.constraint_id!==c.constraint_id))}><X size={12}/></Button>}</div><p className="text-xs leading-relaxed mt-1.5">{c.description}</p></div>)}</div>
   {editingConstraints && <div className="space-y-2 mt-4"><label htmlFor="constraint-description" className="sr-only">New constraint</label><input id="constraint-description" className="field w-full" value={newDescription} onChange={e=>setNewDescription(e.target.value)} placeholder="New constraint…"/><div className="flex gap-2 items-center"><select aria-label="Constraint category" className="field flex-1 min-w-0" value={category} onChange={e=>setCategory(e.target.value as Constraint['category'])}>{['timeline','budget','compliance','operational','technical','risk','strategic'].map(c=><option value={c} key={c}>{c}</option>)}</select><label className="text-xs flex gap-1.5 items-center"><input type="checkbox" checked={hard} onChange={e=>setHard(e.target.checked)}/>Required</label><Button aria-label="Add constraint" title="Add constraint" type="button" variant="outline" size="icon" onClick={addConstraint} disabled={!newDescription.trim()}><Plus size={15}/></Button></div></div>}
   <div className="mt-7 pt-5 border-t border-border"><label className="flex items-center justify-between gap-3 text-xs cursor-pointer"><span>Simulation mode</span><input type="checkbox" role="switch" aria-label="Simulation mode" className="toggle" checked={simulationMode} onChange={e=>setSimulationMode(e.target.checked)}/></label><Button type="submit" disabled={isLoading||!goal.trim()} className="run-button group w-full mt-5 h-11 justify-between" ref={magnet.ref} onPointerMove={magnet.onPointerMove} onPointerLeave={magnet.onPointerLeave}>{isLoading?'Starting deliberation…':'Start deliberation'}{isLoading?<Loader2 className="animate-spin"/>:<ArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5"/>}</Button></div>
  </form>
  <div className="goal-panel-foot"><span className="text-primary">◎</span><span>Independent thinking.<br/>Collective intelligence.</span></div>
 </aside>
}

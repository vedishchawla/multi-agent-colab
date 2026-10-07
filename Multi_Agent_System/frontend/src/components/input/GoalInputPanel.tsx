import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  Layers,
  Plus,
  Trash2,
  Cpu,
  Shield,
  Zap,
} from 'lucide-react';
import { Constraint, ScenarioPreset } from '../../types/schema';

interface GoalInputPanelProps {
  scenarios: ScenarioPreset[];
  isLoading: boolean;
  onStartRun: (params: {
    goal: string;
    constraints: Constraint[];
    scenario_id?: string;
    simulation_mode: boolean;
  }) => void;
}

export const GoalInputPanel: React.FC<GoalInputPanelProps> = ({
  scenarios,
  isLoading,
  onStartRun,
}) => {
  const [goal, setGoal] = useState('Should we launch Product Y in Brazil next quarter?');
  const [constraints, setConstraints] = useState<Constraint[]>([
    {
      constraint_id: 'CST-01',
      category: 'timeline',
      description: 'Target commercial rollout within 12 weeks',
      is_hard_constraint: false,
    },
    {
      constraint_id: 'CST-02',
      category: 'compliance',
      description: 'Mandatory ANATEL statutory certification before retail launch',
      is_hard_constraint: true,
    },
  ]);
  const [simulationMode, setSimulationMode] = useState(false);
  const [showConstraints, setShowConstraints] = useState(false);
  const [newConstraintDesc, setNewConstraintDesc] = useState('');
  const [newConstraintCat, setNewConstraintCat] = useState<Constraint['category']>('operational');
  const [newConstraintHard, setNewConstraintHard] = useState(true);

  const handleSelectScenario = (sc: ScenarioPreset) => {
    setGoal(sc.default_goal);
    setConstraints(sc.default_constraints);
  };

  const handleAddConstraint = () => {
    if (!newConstraintDesc.trim()) return;
    const newC: Constraint = {
      constraint_id: `CST-${String(constraints.length + 1).padStart(2, '0')}`,
      category: newConstraintCat,
      description: newConstraintDesc.trim(),
      is_hard_constraint: newConstraintHard,
    };
    setConstraints([...constraints, newC]);
    setNewConstraintDesc('');
  };

  const handleRemoveConstraint = (id: string) => {
    setConstraints(constraints.filter((c) => c.constraint_id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim() || isLoading) return;
    onStartRun({
      goal: goal.trim(),
      constraints,
      simulation_mode: simulationMode,
    });
  };

  return (
    <section className="surface relative overflow-hidden px-5 py-7 md:px-8 md:py-10">
      <div className="relative mx-auto max-w-5xl">
        <div className="mb-7 max-w-2xl">
          <div className="eyebrow mb-4 flex items-center gap-2">
            <span className="h-px w-7 bg-[#b95432]" />
            New deliberation
          </div>
          <h2 className="max-w-xl text-3xl font-semibold tracking-[-0.045em] text-[#25231f] md:text-4xl">
            Make the next decision with a team that can disagree.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#756e64]">
            Define the decision, set the non-negotiables, and let the right specialists build a defensible recommendation.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="rounded-xl border border-[#ded6c8] bg-[#fffdf8] p-1">
            <label className="flex items-center gap-2 px-4 pt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#756e64]">
              <Sparkles className="h-3.5 w-3.5 text-[#b95432]" />
              The decision to make
            </label>
            <textarea
              rows={3}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="What decision should the team help you make?"
              className="focus-ring w-full resize-none bg-transparent px-4 py-3 text-lg leading-7 tracking-[-0.02em] text-[#25231f] outline-none placeholder:text-[#a39a8d]"
            />
          </div>

          <div className="mt-4 flex flex-col gap-4 border-t border-[#ded6c8] pt-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowConstraints(!showConstraints)}
                className="focus-ring inline-flex items-center gap-2 rounded-full border border-[#ded6c8] bg-[#fffdf8] px-3.5 py-2 text-xs font-medium text-[#4d4840] transition hover:border-[#b95432] hover:text-[#8f3e25]"
              >
                <Shield className="h-3.5 w-3.5 text-[#b95432]" />
                {constraints.length} guardrail{constraints.length === 1 ? '' : 's'}
                <span className="text-[#8e867a]">{showConstraints ? 'Hide' : 'Edit'}</span>
              </button>
              <label className="flex cursor-pointer items-center gap-2 px-2 text-xs text-[#756e64]">
                <input
                  type="checkbox"
                  checked={simulationMode}
                  onChange={(e) => setSimulationMode(e.target.checked)}
                  className="rounded border-[#bfb5a6] bg-[#fffdf8] text-[#b95432] focus:ring-0"
                />
                <Zap className="h-3.5 w-3.5 text-[#b95432]" />
                Simulation
              </label>
            </div>
            <button
              type="submit"
              disabled={isLoading || !goal.trim()}
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-[#b95432] px-5 py-3 text-sm font-semibold text-[#fffaf1] transition hover:bg-[#8f3e25] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? <Cpu className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
              {isLoading ? 'Assembling the team' : 'Start deliberation'}
            </button>
          </div>

          {showConstraints && (
            <div className="mt-4 space-y-2 rounded-xl border border-[#ded6c8] bg-[#f7f2e9] p-3">
              {constraints.map((c) => (
                <div
                  key={c.constraint_id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-[#ded6c8] bg-[#fffdf8] p-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                        c.is_hard_constraint
                          ? 'bg-[#f2dfdd] text-[#a64840] border border-[#d7a39d]'
                          : 'bg-[#e9f0ec] text-[#456553] border border-[#aec1b2]'
                      }`}
                    >
                      {c.is_hard_constraint ? 'HARD' : 'SOFT'}
                    </span>
                    <span className="text-[#4d4840]">{c.description}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveConstraint(c.constraint_id)}
                    className="text-[#8e867a] hover:text-[#a64840] transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Add Constraint Input */}
              <div className="flex items-center gap-2 border-t border-[#ded6c8] pt-2">
                <select
                  value={newConstraintCat}
                  onChange={(e) => setNewConstraintCat(e.target.value as any)}
                  className="bg-[#fffdf8] border border-[#ded6c8] text-[#4d4840] text-xs rounded-lg px-2 py-1.5 outline-none"
                >
                  <option value="timeline">Timeline</option>
                  <option value="budget">Budget</option>
                  <option value="compliance">Compliance</option>
                  <option value="operational">Operational</option>
                  <option value="technical">Technical</option>
                  <option value="risk">Risk</option>
                </select>
                <input
                  type="text"
                  placeholder="New constraint description..."
                  value={newConstraintDesc}
                  onChange={(e) => setNewConstraintDesc(e.target.value)}
                  className="flex-1 bg-[#fffdf8] border border-[#ded6c8] text-[#25231f] text-xs rounded-lg px-2.5 py-1.5 outline-none placeholder:text-[#a39a8d]"
                />
                <label className="flex items-center gap-1 text-[11px] text-[#756e64] shrink-0">
                  <input
                    type="checkbox"
                    checked={newConstraintHard}
                    onChange={(e) => setNewConstraintHard(e.target.checked)}
                    className="rounded bg-[#fffdf8] border-[#bfb5a6] text-[#b95432]"
                  />
                  Hard
                </label>
                <button
                  type="button"
                  onClick={handleAddConstraint}
                  className="px-2.5 py-1.5 rounded-lg bg-[#39352f] hover:bg-[#25231f] text-[#fffaf1] text-xs flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            </div>
          )}
          <div className="mt-7 border-t border-[#ded6c8] pt-4">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#756e64]">
              <Layers className="h-3.5 w-3.5" />
              Start from a scenario
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              {scenarios.map((sc) => (
                <button
                  key={sc.scenario_id}
                  type="button"
                  onClick={() => handleSelectScenario(sc)}
                  className="focus-ring group rounded-lg border border-[#ded6c8] bg-transparent p-3 text-left transition hover:border-[#b95432] hover:bg-[#fbf2ed]"
                >
                  <div className="text-xs font-medium text-[#39352f] group-hover:text-[#8f3e25]">{sc.title}</div>
                  <p className="mt-1.5 line-clamp-2 text-[11px] leading-4 text-[#756e64]">{sc.default_goal}</p>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </section>
  );
};

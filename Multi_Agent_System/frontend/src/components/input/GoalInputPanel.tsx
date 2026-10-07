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
    <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl p-5 shadow-xl">
      {/* Preset Scenario Cards */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Quick Demo Scenarios (Optional Presets)
          </label>
          <span className="text-[11px] text-slate-500">
            or enter any custom high-level decision below
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {scenarios.map((sc) => (
            <button
              key={sc.scenario_id}
              type="button"
              onClick={() => handleSelectScenario(sc)}
              className="text-left p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-cyan-500/50 transition-all duration-200 group"
            >
              <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors line-clamp-1">
                {sc.title}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                {sc.default_goal}
              </div>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Goal Textarea */}
        <div className="mb-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            High-Level Decision Goal
          </label>
          <textarea
            rows={2}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Should our engineering team migrate MongoDB to PostgreSQL? or Should we launch Product Y in Brazil next quarter?"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm text-slate-100 placeholder:text-slate-600 outline-none resize-none transition"
          />
        </div>

        {/* Constraints Toggle & List */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setShowConstraints(!showConstraints)}
              className="text-xs font-medium text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              Decision Constraints ({constraints.length})
              <span className="text-[10px] text-slate-500">
                {showConstraints ? '▲ Hide' : '▼ Expand'}
              </span>
            </button>
          </div>

          {showConstraints && (
            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 space-y-2 mb-3">
              {constraints.map((c) => (
                <div
                  key={c.constraint_id}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800/60 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                        c.is_hard_constraint
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {c.is_hard_constraint ? 'HARD' : 'SOFT'}
                    </span>
                    <span className="text-slate-300">{c.description}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveConstraint(c.constraint_id)}
                    className="text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Add Constraint Input */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/50">
                <select
                  value={newConstraintCat}
                  onChange={(e) => setNewConstraintCat(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1.5 outline-none"
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
                  className="flex-1 bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 outline-none placeholder:text-slate-600"
                />
                <label className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
                  <input
                    type="checkbox"
                    checked={newConstraintHard}
                    onChange={(e) => setNewConstraintHard(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-cyan-500"
                  />
                  Hard
                </label>
                <button
                  type="button"
                  onClick={handleAddConstraint}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls: Simulation Mode & Run Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
            <input
              type="checkbox"
              checked={simulationMode}
              onChange={(e) => setSimulationMode(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Offline Simulation Mode (Zero-token testing)
            </span>
          </label>

          <button
            type="submit"
            disabled={isLoading || !goal.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-600/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
          >
            {isLoading ? (
              <>
                <Cpu className="w-4 h-4 animate-spin" />
                Agents Coordinating...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                Launch Multi-Agent Deliberation
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

import {
  SharedState,
  ScenarioPreset,
  SpecialistProfile,
  Constraint,
  BenchmarkResponse,
} from '../types/schema';

const API_BASE = '/api';

export async function fetchScenarios(): Promise<ScenarioPreset[]> {
  const res = await fetch(`${API_BASE}/scenarios`);
  if (!res.ok) throw new Error('Failed to load scenarios');
  return res.json();
}

export async function fetchSpecialists(): Promise<SpecialistProfile[]> {
  const res = await fetch(`${API_BASE}/runs/roster/specialists`);
  if (!res.ok) throw new Error('Failed to load specialists');
  return res.json();
}

export async function createRun(params: {
  goal: string;
  constraints?: Constraint[];
  scenario_id?: string;
  simulation_mode?: boolean;
}): Promise<SharedState> {
  const res = await fetch(`${API_BASE}/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to start run');
  }
  const data = await res.json();
  return data.state;
}

export async function fetchRun(runId: string): Promise<SharedState> {
  const res = await fetch(`${API_BASE}/runs/${runId}`);
  if (!res.ok) throw new Error('Failed to fetch run');
  const data = await res.json();
  return data.state;
}

export async function submitEscalation(params: {
  runId: string;
  escalationId: string;
  selectedOptionId: string;
  customGuidance?: string;
}): Promise<SharedState> {
  const res = await fetch(`${API_BASE}/runs/${params.runId}/escalate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      escalation_id: params.escalationId,
      selected_option_id: params.selectedOptionId,
      custom_guidance: params.customGuidance,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to submit escalation');
  }
  const data = await res.json();
  return data.state;
}

export async function runBenchmark(runId: string): Promise<BenchmarkResponse> {
  const res = await fetch(`${API_BASE}/runs/${runId}/benchmark`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to generate benchmark');
  return res.json();
}

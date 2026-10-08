export const statusLabels: Record<string, string> = {
 idle: 'Idle', thinking: 'Working', posting_finding: 'Sharing', debating: 'Negotiating', resolved: 'Completed', waiting_human: 'Escalated', re_evaluating: 'Re-evaluating', error: 'Error',
};
export function agentLabel(name: string) { return name.replace(/_/g, ' ').replace(/Agent$/i, '').trim(); }
export function statusTone(state: string) { return state === 'resolved' || state === 'posting_finding' ? 'success' : state === 'waiting_human' || state === 'error' ? 'danger' : state === 'idle' ? 'neutral' : 'active'; }

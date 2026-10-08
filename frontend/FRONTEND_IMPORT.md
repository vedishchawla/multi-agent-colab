# CollaborAI frontend import

Source: https://github.com/vedishchawla/multi-agent-colab, `Multi_Agent_System/frontend`.
The attached source matches the repository's API, schemas and synchronization behavior.

## Preserved
- Original Python application, orchestration, agent architecture and tests in `backend/`.
- Original browser API client in `src/services/api.ts` and schema in `src/types/schema.ts`.
- Original event-driven WebSocket state hook, polling and heartbeat. Only property-access syntax adapts to the host TypeScript rules.
- Goal/constraints/simulation submission, scenario selection, conflict/negotiation auto-switching, human escalation, baseline comparison, final synthesis and claim highlights.

## Hosting boundary
This project runs the redesigned TanStack frontend. The original FastAPI service is not hosted by this frontend's Cloudflare runtime. No replacement agent service or simulated application responses have been added.
The original `/api` HTTP paths and `/api/ws/runs/{runId}` WebSocket path must be routed to the existing deployed Python service by the hosting setup. Until connected, the page truthfully shows Service offline and live runs cannot complete.

## Verification
Home-route test passes. Browser checks covered goal/constraint/simulation payload, graph, findings filters, all detail tabs, recommendation, traceability selection, comparison dialog and Escape close, mobile overflow and reduced motion. Run-based checks used browser-only fixtures, not a live backend, so real AI deliberation remains unverified.

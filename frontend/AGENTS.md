<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- Keep the imported Python backend in `backend/` unchanged; this TanStack project hosts the redesigned frontend, not the Python runtime.
- Mount the collaboration workspace at the TanStack index route; do not introduce an alternative React router or standalone App bootstrap.
- Keep the imported API client, schemas and WebSocket state hook behaviorally unchanged (index-signature syntax may adapt to the host TypeScript checks) so the frontend retains the original HTTP contracts and event-driven data flow.
- Use shared semantic design tokens and existing Button/Dialog primitives for presentation changes; the graph consumes the same live SharedState and adds visualization-only knowledge nodes.

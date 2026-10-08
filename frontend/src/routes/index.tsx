import { createFileRoute } from '@tanstack/react-router';
import { Workspace } from '@/components/collaboration/Workspace';
export const Route = createFileRoute('/')({
 head: () => ({meta: [
  {title: 'Decision studio — CollaborAI'},
  {name: 'description', content: 'A considered space for collaborative AI decisions. Follow specialist agents, shared findings, negotiations and traceable recommendations.'},
  {property: 'og:title', content: 'Decision studio — CollaborAI'},
  {property: 'og:description', content: 'Many perspectives. One considered decision. A collaborative multi-agent workspace with evidence and traceability.'},
  {property: 'og:type', content: 'website'},
  {name: 'twitter:card', content: 'summary_large_image'},
 ]}),
 component: Workspace,
});

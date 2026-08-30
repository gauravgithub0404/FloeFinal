import { UiSuggestion } from '../types/floe';

export const UI_SUGGESTIONS: UiSuggestion[] = [
  {
    id: 'sug-1',
    category: 'trust',
    title: 'Visual Trust Badges on AI Steps',
    summary: 'Distinguish AI inferences from deterministic rules so users and compliance teams know exactly when an LLM is acting.',
    rationale: 'In enterprise workflows, mixing deterministic rules with LLM outputs without clear labels causes anxiety for managers. Using clear visual badges (e.g. [AI Single-Inference • 94% confidence] vs [Deterministic Rule]) increases adoption by 40%.',
    codeSnippet: `<div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
  <Sparkles className="w-3.5 h-3.5" />
  <span>AI Suggested: Medical Leave (94% confidence)</span>
</div>`
  },
  {
    id: 'sug-2',
    category: 'workflow',
    title: 'One-Click Magic Decision Links for Managers',
    summary: 'Allow busy managers to approve or escalate time-off directly from notification emails or Slack without logging in.',
    rationale: 'Most approval delays (and timeouts) occur because managers must switch context, log in, and navigate a complex dashboard. A signed, short-lived HMAC token allows instant 1-click approvals with zero friction.',
    codeSnippet: `// Signed magic link inside email template
const magicLink = \`https://app.corp/api/workflows/decision?token=\${signJwt({ requestId, action: 'approve' })}\`;`
  },
  {
    id: 'sug-3',
    category: 'form',
    title: 'Dynamic Real-Time PTO Balance Calculator',
    summary: 'Calculate remaining PTO balance dynamically on the client before submission, with business days & holiday exclusion.',
    rationale: 'Users frequently submit invalid requests for more days than they have available, which causes unnecessary server round-trips and immediate rejections. Real-time balance validation delivers instant feedback.',
    codeSnippet: `<div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm">
  <div className="flex justify-between text-slate-600"><span>Current Balance:</span> <b>20 days</b></div>
  <div className="flex justify-between text-indigo-600"><span>This Request:</span> <b>-3 days</b></div>
  <div className="flex justify-between pt-1.5 border-t border-slate-200 font-semibold text-emerald-700">
    <span>Balance After Approval:</span> <b>17 days</b>
  </div>
</div>`
  },
  {
    id: 'sug-4',
    category: 'workflow',
    title: 'Timeout Countdown & Escalation Breadcrumb',
    summary: 'Render an interactive countdown timer showing remaining hours before automatic HR escalation occurs.',
    rationale: 'Human steps with 48h timeouts can surprise managers if they do not see how much time remains. A visible countdown timer with the target escalation role promotes proactive accountability.',
    codeSnippet: `<div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200">
  <Clock className="w-3.5 h-3.5 animate-pulse" />
  <span>Awaiting Manager • 34h remaining before auto-escalating to HR Admin</span>
</div>`
  },
  {
    id: 'sug-5',
    category: 'telemetry',
    title: 'Live Agent Cost & Latency Transparency Counter',
    summary: 'Display the real-time compute cost (e.g. $0.0004) and token consumption per generated artifact.',
    rationale: 'Enterprise IT buyers love transparency. Showing the exact token consumption and sub-second generation latency builds immense credibility compared to opaque "magic" AI tools.',
    codeSnippet: `<div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
  <span>Tokens: 1,420 in / 680 out</span>
  <span>Cost: $0.00042</span>
  <span>Execution: 380ms</span>
</div>`
  }
];

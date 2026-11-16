/** What a run looks at: every source, or only what Git reports as changed. */
export type AgentTestScopeTarget =
	{ kind: 'all' } | { kind: 'changed' } | { kind: 'staged' } | { kind: 'base'; ref: string };

/** What a run looks at: every source, or only what Git reports as changed, staged, or differing from a base ref. */
export type AgentTestScope =
	{ kind: 'all' } | { kind: 'changed' } | { kind: 'staged' } | { kind: 'base'; ref: string };

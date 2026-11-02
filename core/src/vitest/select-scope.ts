import type { RunScope } from '../discovery/index.js';
import type { AgentTestsOptions } from './types.js';

/** Explicit scopes win; otherwise check uncommitted files locally and base-branch changes in CI. */
export const selectHostedScope = (
	options: AgentTestsOptions,
	environment: NodeJS.ProcessEnv = process.env
): RunScope => {
	if (options.scope) return options.scope;
	if (environment.CI) {
		const base =
			options.base ??
			(environment.GITHUB_BASE_REF ? `origin/${environment.GITHUB_BASE_REF}` : 'origin/main');
		return { base };
	}
	return { changed: true };
};

import { relative } from 'node:path';
import { failRefresh } from './fail-refresh.js';
import { refreshProject } from './refresh-project.js';
import type { WatchState } from './types.js';

/** Ignore unrelated/dependency paths and serialize refreshes; failures become a hosted failing test. */
export const createChangeHandler =
	(state: WatchState): ((path: string) => void) =>
	(path) => {
		const local = relative(state.project.provided.root, path);
		if (local.startsWith('..') || /(^|[/\\])(node_modules|\.git)([/\\]|$)/.test(local)) return;
		state.refresh = state.refresh
			.then(() => refreshProject(state, local))
			.catch(() => failRefresh(state));
	};

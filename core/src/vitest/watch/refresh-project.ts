import { writeFile } from 'node:fs/promises';
import { collectHostedGroups } from '../collect.js';
import type { WatchState } from './types.js';

/** Recollect targets, publish changed context and rewrite the canonical entry to trigger a rerun. */
export const refreshProject = async (state: WatchState, local: string): Promise<void> => {
	const { provided, source, entry } = state.project;
	const groups = await collectHostedGroups(provided.root, provided.scope, provided.cacheDirectory);
	const configurationChanged = /(^|[/\\])(agent-tests\.config\.yaml|\.env)$/.test(local);
	if (
		!provided.error &&
		!configurationChanged &&
		JSON.stringify(groups) === JSON.stringify(provided.groups)
	)
		return;
	delete provided.error;
	provided.groups = groups;
	for (const project of state.projects) project.provide('agentTests', provided);
	await writeFile(entry, `${source}// ${Date.now()}\n`);
};

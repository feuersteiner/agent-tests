import { writeFile } from 'node:fs/promises';
import type { WatchState } from './types.js';

/** Publish one collection failure until a later successful refresh can recover the hosted project. */
export const failRefresh = async (state: WatchState): Promise<void> => {
	const { provided, source, entry } = state.project;
	if (provided.error) return;
	provided.error = 'Unable to refresh agent test targets';
	for (const project of state.projects) project.provide('agentTests', provided);
	await writeFile(entry, `${source}// failed ${Date.now()}\n`);
};

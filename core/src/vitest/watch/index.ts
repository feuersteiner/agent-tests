import type { TestProject, VitestPluginContext } from 'vitest/node';
import type { HostedProject } from '../types.js';
import { cleanupWatch } from './cleanup-watch.js';
import { subscribeWatch } from './subscribe-watch.js';
import type { WatchState } from './types.js';
import { createChangeHandler } from './utils.js';

/** Subscribe to repository changes and return a release that drains all already queued refreshes. */
export const watchProject = (
	context: VitestPluginContext,
	project: HostedProject,
	projects: TestProject[]
): (() => Promise<void>) => {
	const state: WatchState = { project, projects, refresh: Promise.resolve() };
	const changed = createChangeHandler(state);
	subscribeWatch(context, project, changed);
	return () => cleanupWatch(context, state, changed);
};

import type { VitestPluginContext } from 'vitest/node';
import type { AgentTestsOptions, PluginState } from '../types.js';
import { watchProject } from '../watch/index.js';
import { createProject } from './create-project.js';
import { injectProject } from './inject-project.js';

/** Prepare, inject and optionally watch one hosted project; setup failures propagate to Vitest. */
export const prepareProject = async (
	context: VitestPluginContext,
	options: AgentTestsOptions,
	state: PluginState
): Promise<void> => {
	const project = await createProject(options, context.project.config.root, state);
	const projects = await injectProject(context, project);
	if (context.vitest.config.watch) state.stopWatching = watchProject(context, project, projects);
};

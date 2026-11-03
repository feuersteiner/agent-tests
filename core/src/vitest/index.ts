import type { Plugin } from 'vitest/config';
import { cleanupProject } from './cleanup-project.js';
import { prepareProject } from './prepare/index.js';
import type { AgentTestsOptions, PluginState } from './types.js';

/** Add installed checks as an independent Vitest 5 project, with private temporary/cache state. */
export const agentTests = (options: AgentTestsOptions = {}): Plugin => {
	const state: PluginState = {};
	return {
		name: 'agent-tests',
		configureVitest: (context) => prepareProject(context, options, state),
		closeBundle: () => cleanupProject(state)
	};
};

export default agentTests;
export type { AgentTestsOptions } from './types.js';

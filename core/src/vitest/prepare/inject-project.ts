import { join } from 'node:path';
import type { TestProject, VitestPluginContext } from 'vitest/node';
import type { HostedProject } from '../types.js';

/** Inject an independent Node project with serializable check data; Vitest injection failures propagate. */
export const injectProject = (
	context: VitestPluginContext,
	project: HostedProject
): Promise<TestProject[]> => {
	return context.injectTestProjects({
		extends: false,
		root: project.directory,
		cacheDir: join(project.directory, 'vite-cache'),
		test: {
			name: 'agent-tests',
			include: ['agent-tests.test.mjs'],
			environment: 'node',
			provide: { agentTests: project.provided }
		}
	});
};

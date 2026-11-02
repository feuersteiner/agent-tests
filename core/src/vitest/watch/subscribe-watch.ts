import type { VitestPluginContext } from 'vitest/node';
import type { HostedProject } from '../types.js';

/** Watch repository/generated files and subscribe the same handler to all target-changing events. */
export const subscribeWatch = (
	context: VitestPluginContext,
	project: HostedProject,
	changed: (path: string) => void
): void => {
	const watcher = context.vitest.vite.watcher;
	watcher.add([project.provided.root, project.entry]);
	watcher.on('change', changed).on('add', changed).on('unlink', changed);
};

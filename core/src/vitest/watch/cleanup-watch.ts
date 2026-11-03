import type { VitestPluginContext } from 'vitest/node';
import type { WatchState } from './types.js';

/** Detach every installed event handler before awaiting the final queued refresh. */
export const cleanupWatch = async (
	context: VitestPluginContext,
	state: WatchState,
	changed: (path: string) => void
): Promise<void> => {
	for (const event of ['change', 'add', 'unlink']) context.vitest.vite.watcher.off(event, changed);
	await state.refresh;
};

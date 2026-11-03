import { rm } from 'node:fs/promises';
import type { PluginState } from './types.js';

/** Unsubscribe and drain refreshes before removing the temporary project; filesystem failures propagate. */
export const cleanupProject = async (state: PluginState): Promise<void> => {
	await state.stopWatching?.();
	if (state.temporary) await rm(state.temporary, { recursive: true, force: true });
};

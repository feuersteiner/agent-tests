import type { TestProject } from 'vitest/node';
import type { HostedProject } from '../types.js';

/** Serializes source refreshes for the injected projects while retaining the latest worker context. */
export interface WatchState {
	project: HostedProject;
	projects: TestProject[];
	refresh: Promise<void>;
}

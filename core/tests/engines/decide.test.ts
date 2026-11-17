import { describe, expect, test } from 'bun:test';
import { createDecideEngine } from '../../src/engines/decide.ts';
import { validConfig } from '../helpers/fixtures.ts';
import type { AgentTestEnv } from '../../src/engines/types.ts';

/** Runs `create` while every fetch throws, then restores fetch; returns what it built and how many fetches it tried. */
const createOffline = <T>(create: () => T): { created: T; fetches: number } => {
	const original = globalThis.fetch;
	let fetches = 0;
	globalThis.fetch = (() => {
		fetches += 1;
		throw new Error('No network in tests');
	}) as unknown as typeof fetch;
	try {
		const created = create();
		return { created, fetches };
	} finally {
		globalThis.fetch = original;
	}
};

const decision = validConfig().decision;

describe('createDecideEngine', () => {
	test.each([
		['missing', {}],
		['undefined', { TEAM_DECISION_KEY: undefined }],
		['empty', { TEAM_DECISION_KEY: '' }],
		['whitespace-only', { TEAM_DECISION_KEY: ' \t\n' }]
	] as [string, AgentTestEnv][])(
		'throws naming the decision key variable when it is %s',
		(_, env) => {
			const settings = { ...decision, apiKeyEnv: 'TEAM_DECISION_KEY' };
			expect(() => createDecideEngine(settings, env)).toThrow(
				'Missing environment variable: TEAM_DECISION_KEY'
			);
		}
	);

	test.each(['openai', 'jev'] as const)(
		'creates an engine for the %s api without a network request',
		(api) => {
			const { created, fetches } = createOffline(() =>
				createDecideEngine({ ...decision, api }, { DECISION_KEY: 'fake-decision-key' })
			);
			expect(created).toBeFunction();
			expect(fetches).toBe(0);
		}
	);
});

import { describe, expect, test } from 'bun:test';
import { createReasonEngine } from '../../src/engines/reason.ts';
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

const reasoning = validConfig().reasoning;

describe('createReasonEngine', () => {
	test.each([
		['missing', {}],
		['undefined', { TEAM_REASONING_KEY: undefined }],
		['empty', { TEAM_REASONING_KEY: '' }],
		['whitespace-only', { TEAM_REASONING_KEY: ' \t\n' }]
	] as [string, AgentTestEnv][])(
		'throws naming the reasoning key variable when it is %s',
		(_, env) => {
			const settings = { ...reasoning, apiKeyEnv: 'TEAM_REASONING_KEY' };
			expect(() => createReasonEngine(settings, env)).toThrow(
				'Missing environment variable: TEAM_REASONING_KEY'
			);
		}
	);

	test.each(['openai', 'anthropic'] as const)(
		'creates an engine for the %s api without a network request',
		(api) => {
			const { created, fetches } = createOffline(() =>
				createReasonEngine({ ...reasoning, api }, { REASONING_KEY: 'fake-reasoning-key' })
			);
			expect(created).toBeFunction();
			expect(fetches).toBe(0);
		}
	);
});

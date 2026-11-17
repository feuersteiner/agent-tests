import { describe, expect, test } from 'bun:test';
import { Agentests } from '../../src/index.ts';
import { ENV, validConfig } from '../helpers/fixtures.ts';
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
		return { created: create(), fetches };
	} finally {
		globalThis.fetch = original;
	}
};

describe('new Agentests', () => {
	test.each([
		['DECISION_KEY', 'missing', { REASONING_KEY: 'fake-reasoning-key' }],
		['DECISION_KEY', 'empty', { DECISION_KEY: '', REASONING_KEY: 'fake-reasoning-key' }],
		['DECISION_KEY', 'blank', { DECISION_KEY: '  ', REASONING_KEY: 'fake-reasoning-key' }],
		['REASONING_KEY', 'missing', { DECISION_KEY: 'fake-decision-key' }],
		['REASONING_KEY', 'empty', { DECISION_KEY: 'fake-decision-key', REASONING_KEY: '' }],
		['REASONING_KEY', 'blank', { DECISION_KEY: 'fake-decision-key', REASONING_KEY: '\t' }]
	] as [string, string, AgentTestEnv][])('throws naming %s when it is %s', (variable, _, env) => {
		expect(() => new Agentests(validConfig(), env)).toThrow(
			`Missing environment variable: ${variable}`
		);
	});

	test('constructs without a network request when both keys are present', () => {
		const { created, fetches } = createOffline(() => new Agentests(validConfig(), ENV));
		expect(created).toBeInstanceOf(Agentests);
		expect(fetches).toBe(0);
	});
});

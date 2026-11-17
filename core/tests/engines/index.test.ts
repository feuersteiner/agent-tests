import { describe, expect, test } from 'bun:test';
import { createEngines } from '../../src/engines/index.ts';
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
		const created = create();
		return { created, fetches };
	} finally {
		globalThis.fetch = original;
	}
};

const settings = { decision: validConfig().decision, reasoning: validConfig().reasoning };

describe('createEngines', () => {
	test.each([
		['DECISION_KEY', 'missing', { REASONING_KEY: 'fake-reasoning-key' }],
		['DECISION_KEY', 'empty', { DECISION_KEY: '', REASONING_KEY: 'fake-reasoning-key' }],
		[
			'DECISION_KEY',
			'whitespace-only',
			{ DECISION_KEY: '  ', REASONING_KEY: 'fake-reasoning-key' }
		],
		['REASONING_KEY', 'missing', { DECISION_KEY: 'fake-decision-key' }],
		['REASONING_KEY', 'empty', { DECISION_KEY: 'fake-decision-key', REASONING_KEY: '' }],
		['REASONING_KEY', 'whitespace-only', { DECISION_KEY: 'fake-decision-key', REASONING_KEY: '\t' }]
	] as [string, string, AgentTestEnv][])('throws naming %s when it is %s', (variable, _, env) => {
		expect(() => createEngines(settings, env)).toThrow(`Missing environment variable: ${variable}`);
	});

	test('returns the four engines without a network request when both keys are present', () => {
		const { created, fetches } = createOffline(() => createEngines(settings, ENV));
		expect(Object.keys(created).sort()).toEqual(['decide', 'glob', 'grep', 'reason']);
		for (const engine of Object.values(created)) expect(engine).toBeFunction();
		expect(fetches).toBe(0);
	});

	test('returns a working glob engine', async () => {
		const { glob } = createEngines(settings, ENV);
		expect(await glob('src/a.ts', 'src/**/*.ts')).toBe(1);
		expect(await glob('docs/a.md', 'src/**/*.ts')).toBe(0);
	});

	test('returns a working grep engine', async () => {
		const { grep } = createEngines(settings, ENV);
		expect(await grep('TODO one, TODO two', 'TODO')).toBe(2);
		expect(await grep('nothing here', 'TODO')).toBe(0);
	});
});

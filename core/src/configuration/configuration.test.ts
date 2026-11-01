import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createConfiguredModel, loadConfiguration, parseConfiguration } from './index.js';

let root: string;
beforeEach(async () => {
	root = await mkdtemp(join(tmpdir(), 'agent-tests-configuration-'));
});
afterEach(async () => {
	await rm(root, { recursive: true, force: true });
});

describe('configuration loading', () => {
	it('uses empty configuration when optional files are absent', async () => {
		const loaded = await loadConfiguration(root, {});
		expect(loaded.config).toEqual({});
		expect(loaded.environment).toEqual({});
		expect(createConfiguredModel(loaded)).toBeUndefined();
	});

	it('gives current environment priority over .env without mutating process.env', async () => {
		await writeFile(join(root, '.env'), 'MODEL_KEY=from-file\nOTHER_KEY=from-file\n');
		const before = process.env.MODEL_KEY;
		const loaded = await loadConfiguration(root, { MODEL_KEY: 'from-environment' });
		expect(loaded.environment.MODEL_KEY).toBe('from-environment');
		expect(loaded.environment.OTHER_KEY).toBe('from-file');
		expect(process.env.MODEL_KEY).toBe(before);
	});

	it('does not let undefined environment entries erase .env values', async () => {
		await writeFile(join(root, '.env'), 'MODEL_KEY=from-file\n');
		expect((await loadConfiguration(root, { MODEL_KEY: undefined })).environment.MODEL_KEY).toBe(
			'from-file'
		);
	});

	it('loads strict provider settings and a custom credential variable', async () => {
		await writeFile(
			join(root, 'agent-tests.config.yaml'),
			'model:\n  provider: openai-compatible\n  model: custom\n  apiKeyEnv: MODEL_KEY\n' +
				'  baseUrl: https://models.example/v1\nlibrary:\n  repository: owner/repo\n  ref: main\n'
		);
		const loaded = await loadConfiguration(root, { MODEL_KEY: 'offline-test-key' });
		expect(loaded.config.model?.model).toBe('custom');
		expect(createConfiguredModel(loaded)?.decide).toBeTypeOf('function');
		expect(createConfiguredModel({ ...loaded, environment: {} })).toBeUndefined();
	});

	it('rejects unknown fields and inline credentials without exposing values', () => {
		for (const text of [
			'unknown: private-value',
			'model:\n  provider: openai\n  model: x\n  apiKey: private-value',
			'model: [private-value',
			'library:\n  unknown: private-value'
		]) {
			expect(() => parseConfiguration(text)).toThrow('Invalid agent-tests.config.yaml');
			expect(() => parseConfiguration(text)).not.toThrow('private-value');
		}
	});
});

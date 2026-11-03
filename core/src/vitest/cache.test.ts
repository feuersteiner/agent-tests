import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { createMockModel } from '../models/index.js';
import { createCachedModel } from './cache/index.js';
import { modelIdentity } from './model-identity.js';
import { selectHostedScope } from './select-scope.js';

const directories: string[] = [];
afterEach(async () => {
	await Promise.all(
		directories.splice(0).map((path) => rm(path, { recursive: true, force: true }))
	);
});
const directory = async (): Promise<string> => {
	const path = await mkdtemp(join(tmpdir(), 'agent-tests-cache-test-'));
	directories.push(path);
	return path;
};

test('answers are reused across wrappers only for identical model and request', async () => {
	const path = await directory();
	let calls = 0;
	const model = createMockModel(() => {
		calls++;
		return { decision: 'pass' };
	});
	const first = createCachedModel(model, path, 'model-a')!;
	const request = { ask: 'formal?', content: 'Hello' };
	await Promise.all([first.decide(request), first.decide(request)]);
	expect(calls).toBe(1);
	await createCachedModel(model, path, 'model-a')!.decide(request);
	expect(calls).toBe(1);
	await first.decide({ ...request, content: 'Changed' });
	await createCachedModel(model, path, 'model-b')!.decide(request);
	expect(calls).toBe(3);
});

test('rejected model calls are retried and never cached', async () => {
	let calls = 0;
	const model = createMockModel(() => {
		if (++calls === 1) throw new Error('Unavailable');
		return { decision: 'pass' };
	});
	const cached = createCachedModel(model, await directory(), 'model')!;
	await expect(cached.decide({ ask: 'question' })).rejects.toThrow('Unavailable');
	await expect(cached.decide({ ask: 'question' })).resolves.toEqual({ decision: 'pass' });
	expect(calls).toBe(2);
});

test('credentials affect opaque identity without appearing in it', () => {
	const first = modelIdentity({ model: 'same' }, 'private-one');
	expect(first).not.toContain('private-one');
	expect(first).not.toBe(modelIdentity({ model: 'same' }, 'private-two'));
});

test('scope defaults and explicit overrides are deterministic', () => {
	expect(selectHostedScope({}, {})).toEqual({ changed: true });
	expect(selectHostedScope({}, { CI: '1' })).toEqual({ base: 'origin/main' });
	expect(selectHostedScope({}, { CI: '1', GITHUB_BASE_REF: 'release' })).toEqual({
		base: 'origin/release'
	});
	expect(selectHostedScope({ scope: { staged: true } }, { CI: '1' })).toEqual({ staged: true });
	expect(selectHostedScope({ base: 'custom' }, { CI: '1' })).toEqual({ base: 'custom' });
});

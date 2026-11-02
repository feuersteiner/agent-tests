import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { createPluginFixture, runPluginFixture } from './tests/fixture.js';
import { startPluginWatch } from './tests/watch.js';

const roots: string[] = [];
afterEach(async () => {
	await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});
const fast = {
	id: 'formal',
	message: 'Informal prose',
	fix: 'Write formally',
	fast: { match: 'gonna' }
};

test('actual Vitest CLI runs ordinary tests and injected passing and no-target tests', async () => {
	const root = await createPluginFixture('Formal prose', [fast]);
	roots.push(root);
	const result = await runPluginFixture(root);
	expect(result.output).not.toContain('Unhandled');
	expect(result.exitCode, result.output).toBe(0);
	expect(result.report.numTotalTests).toBe(3);
	expect(result.report.numFailedTests).toBe(0);
	expect(result.report.numPendingTests).toBe(1);
	expect(JSON.stringify(result.report)).toContain('reference');
});

test('actual Vitest CLI fails violations and annotates warnings while preserving skipped targets', async () => {
	const warning = {
		id: 'uncertain',
		message: 'Uncertain prose',
		fix: 'Review phrasing',
		fast: { maybe: 'maybe' }
	};
	const root = await createPluginFixture('gonna maybe', [fast, warning]);
	roots.push(root);
	const result = await runPluginFixture(root);
	expect(result.exitCode, result.output).toBe(1);
	expect(result.report.numTotalTests).toBe(4);
	expect(result.report.numFailedTests).toBe(1);
	expect(result.report.numPendingTests).toBe(1);
	const report = JSON.stringify(result.report);
	expect(report).toContain('Informal prose');
	expect(JSON.stringify(result.annotations)).toContain('warning');
	expect(JSON.stringify(result.annotations)).toContain('Uncertain prose');
});

test('unavailable model checks are reported as skipped by the real runner', async () => {
	const root = await createPluginFixture('Formal prose', [
		{
			id: 'model-rule',
			message: 'Model judgment',
			fix: 'Review prose',
			smart: { ask: 'Is prose formal?' }
		}
	]);
	roots.push(root);
	const result = await runPluginFixture(root);
	expect(result.exitCode, result.output).toBe(0);
	expect(result.report.numTotalTests).toBe(3);
	expect(result.report.numPendingTests).toBe(2);
	expect(JSON.stringify(result.annotations)).toContain('Model unavailable');
});

test.each([false, true])(
	'watch refreshes changed targets with symlinked TMPDIR=%s',
	async (symlinked) => {
		const root = await createPluginFixture('Formal prose', [fast]);
		roots.push(root);
		const environment: NodeJS.ProcessEnv = {};
		if (symlinked) {
			const temporary = await mkdtemp(join(tmpdir(), 'agent-tests-temp-alias-'));
			roots.push(temporary);
			await mkdir(join(temporary, 'actual'));
			await symlink(join(temporary, 'actual'), join(temporary, 'alias'), 'dir');
			environment.TMPDIR = join(temporary, 'alias');
		}
		const watch = startPluginWatch(root, environment);
		try {
			await watch.waitForFailures(0);
			await writeFile(join(root, 'src/help.md'), 'gonna change');
			await watch.waitForFailures(1);
			await writeFile(join(root, 'src/help.md'), 'Formal again');
			await watch.waitForFailures(0);
		} finally {
			await watch.close();
		}
	}
);

import { afterAll, beforeAll, expect, test } from 'bun:test';
import { join } from 'node:path';
import { hashDataset, loadContenders, loadDataset } from '../src/dataset.ts';

const previous = process.cwd();
beforeAll(() => process.chdir(join(import.meta.dirname, '..')));
afterAll(() => process.chdir(previous));

test('the dataset keeps the one-eval-one-decision shape', async () => {
	const { cases, problems } = await loadDataset();
	expect(problems).toEqual([]);
	expect(cases.length).toBeGreaterThan(200);
	expect(new Set(cases.map((item) => item.id)).size).toBe(cases.length);
});

test('both tiers and both labels are present', async () => {
	const { cases } = await loadDataset();
	expect(new Set(cases.map((item) => item.tier))).toEqual(new Set(['hand', 'linter']));
	const passing = cases.filter((item) => item.expect === 'pass').length;
	expect(passing / cases.length).toBeGreaterThan(0.4);
	expect(passing / cases.length).toBeLessThan(0.6);
});

test('the hash changes with a label', async () => {
	const { cases } = await loadDataset();
	const [first, ...rest] = cases;
	const flipped = {
		...first!,
		expect: first!.expect === 'pass' ? ('fail' as const) : ('pass' as const)
	};
	expect(hashDataset([flipped, ...rest])).not.toBe(hashDataset(cases));
});

test('the contenders share one threshold and differ in model', () => {
	const { threshold, contenders } = loadContenders();
	expect(threshold).toBe(0.5);
	expect(new Set(contenders.map(({ decision }) => decision.model)).size).toBe(contenders.length);
});

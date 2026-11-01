import { readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { stringify } from 'yaml';
import { fixture } from './tests/fixtures.js';
import { validateTest, validateTests } from './index.js';

const roots: string[] = [];
afterEach(async () => {
	await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('validation', () => {
	it('validates the reference test and reports stale source without modifying files', async () => {
		const test = await fixture();
		roots.push(test.root);
		const before = await readFile(join(test.directory, 'test.yaml'), 'utf8');
		expect(await validateTest(test.directory)).toMatchObject({
			valid: true,
			exitCode: 0,
			issues: []
		});
		await writeFile(join(test.directory, 'TEST.md'), 'A changed rule.\n');
		expect((await validateTest(test.directory)).issues).toContainEqual(
			expect.objectContaining({ code: 'source-stale' })
		);
		expect(await readFile(join(test.directory, 'test.yaml'), 'utf8')).toBe(before);
	});

	it('finds malformed definitions and uncompiled tests instead of skipping them', async () => {
		const test = await fixture();
		roots.push(test.root);
		await writeFile(
			join(test.directory, 'test.yaml'),
			stringify({ ...test.definition, unknown: true })
		);
		expect(await validateTests(test.root)).toMatchObject([
			{ valid: false, issues: [{ code: 'schema-invalid' }] }
		]);
		await rm(join(test.directory, 'test.yaml'));
		expect(await validateTests(test.root)).toMatchObject([
			{ valid: false, issues: [{ code: 'schema-invalid' }] }
		]);
	});

	it('reports a false positive and a missed violation in labeled examples', async () => {
		const test = await fixture();
		roots.push(test.root);
		test.definition.checks[0]!.fast = { match: 'going to' };
		await writeFile(join(test.directory, 'test.yaml'), stringify(test.definition));
		const result = await validateTest(test.directory);
		expect(result.valid).toBe(false);
		expect(result.issues.filter((issue) => issue.code === 'pattern-eval-mismatch')).toHaveLength(2);
	});

	it('rejects invalid and risky regexes before executing examples', async () => {
		const test = await fixture();
		roots.push(test.root);
		test.definition.checks[0]!.fast = { match: '[' };
		await writeFile(join(test.directory, 'test.yaml'), stringify(test.definition));
		expect((await validateTest(test.directory)).issues).toContainEqual(
			expect.objectContaining({ code: 'pattern-invalid', severity: 'error' })
		);
		test.definition.checks[0]!.fast = { match: '(a+)+$' };
		await writeFile(join(test.directory, 'test.yaml'), stringify(test.definition));
		expect((await validateTest(test.directory)).issues).toContainEqual(
			expect.objectContaining({ code: 'pattern-risky', severity: 'error' })
		);
	});

	it('does not approve unverified evals when a risky pattern blocks comparisons', async () => {
		const test = await fixture();
		roots.push(test.root);
		test.definition.checks[0]!.fast = { match: '(a)\\1' };
		test.definition.evals = [
			{ name: 'Unverified', path: 'src/a.md', content: 'bb', expect: 'fail' }
		];
		await writeFile(join(test.directory, 'test.yaml'), stringify(test.definition));
		expect(await validateTest(test.directory)).toMatchObject({
			valid: false,
			exitCode: 1,
			issues: [expect.objectContaining({ code: 'pattern-risky', severity: 'error' })]
		});
	});

	it('does not require model credentials for uncertain smart-only examples', async () => {
		const test = await fixture();
		roots.push(test.root);
		delete test.definition.checks[0]!.fast;
		test.definition.checks[0]!.smart = { ask: 'Find informal English.' };
		await writeFile(join(test.directory, 'test.yaml'), stringify(test.definition));
		expect(await validateTest(test.directory)).toMatchObject({ valid: true, issues: [] });
	});

	it('reports missing ids explicitly', async () => {
		const test = await fixture();
		roots.push(test.root);
		await expect(validateTests(test.root, 'missing')).rejects.toThrow('not installed');
	});
});

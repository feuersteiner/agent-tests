import { describe, expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadEvalDefinitions, loadEvalFiles } from '../../../src/loader/index.ts';
import { testFolder, validTest } from '../../helpers/fixtures.ts';
import { inTempDir } from '../../helpers/temp.ts';

const EVALS = '.agents/tests/no-todo/evals';

describe('loadEvalFiles', () => {
	test('gives an empty list for a Test with no evals folder', async () => {
		await inTempDir(testFolder(validTest()), () => {
			expect(loadEvalFiles('no-todo')).toEqual([]);
		});
	});

	test('gives each eval folder its folder name as id, its path as root, and its expect', async () => {
		const files = testFolder(validTest(), {
			clean: { expect: 'pass', files: { 'src/a.ts': 'ok' } },
			dirty: { expect: 'fail', files: { 'src/a.ts': '// TODO' } }
		});
		await inTempDir(files, () => {
			const loaded = loadEvalFiles('no-todo');
			expect(loaded).toEqual([
				{
					path: join(EVALS, 'clean/eval.yaml'),
					eval: { id: 'clean', root: join(EVALS, 'clean'), expect: 'pass' }
				},
				{
					path: join(EVALS, 'dirty/eval.yaml'),
					eval: { id: 'dirty', root: join(EVALS, 'dirty'), expect: 'fail' }
				}
			]);
			expect(existsSync(join(loaded[0]!.eval!.root, 'src/a.ts'))).toBe(true);
		});
	});

	test('gives a folder with no eval.yaml its path and a missing-file error', async () => {
		const files = { ...testFolder(validTest()), [`${EVALS}/bare/src/a.ts`]: 'ok' };
		await inTempDir(files, () => {
			expect(loadEvalFiles('no-todo')).toEqual([
				{ path: join(EVALS, 'bare/eval.yaml'), error: 'Missing eval.yaml' }
			]);
		});
	});

	test('gives an invalid eval.yaml its path and its problems', async () => {
		const files = { ...testFolder(validTest()), [`${EVALS}/odd/eval.yaml`]: 'expect: maybe\n' };
		await inTempDir(files, () => {
			expect(loadEvalFiles('no-todo')).toEqual([
				{ path: join(EVALS, 'odd/eval.yaml'), error: 'expect: Expected pass, fail, or skip' }
			]);
		});
	});

	test('loads the eval folders sorted by name in code-point order, not locale order', async () => {
		const evals = Object.fromEntries(
			['b-rule', 'rule-9', 'a-rule', 'rule-10'].map((id) => [
				id,
				{ expect: 'pass' as const, files: {} }
			])
		);
		const files = { ...testFolder(validTest(), evals), [`${EVALS}/Bare/src/a.ts`]: 'ok' };
		await inTempDir(files, () => {
			expect(loadEvalFiles('no-todo').map(({ path }) => path)).toEqual(
				['Bare', 'a-rule', 'b-rule', 'rule-10', 'rule-9'].map((id) => join(EVALS, id, 'eval.yaml'))
			);
		});
	});

	test('ignores plain files inside the evals folder', async () => {
		const files = {
			...testFolder(validTest(), { clean: { expect: 'pass', files: {} } }),
			[`${EVALS}/README.md`]: 'notes',
			[`${EVALS}/eval.yaml`]: 'expect: pass\n'
		};
		await inTempDir(files, () => {
			expect(loadEvalFiles('no-todo').map((file) => file.eval?.id)).toEqual(['clean']);
		});
	});
});

describe('loadEvalDefinitions', () => {
	test('gives an empty list for a Test with no evals folder', async () => {
		await inTempDir(testFolder(validTest()), () => {
			expect(loadEvalDefinitions('no-todo')).toEqual([]);
		});
	});

	test('gives each eval folder its folder name as id, its path as root, and its expect', async () => {
		const files = testFolder(validTest(), {
			clean: { expect: 'pass', files: {} },
			empty: { expect: 'skip', files: {} }
		});
		await inTempDir(files, () => {
			expect(loadEvalDefinitions('no-todo')).toEqual([
				{ id: 'clean', root: join(EVALS, 'clean'), expect: 'pass' },
				{ id: 'empty', root: join(EVALS, 'empty'), expect: 'skip' }
			]);
		});
	});

	test('ignores plain files inside the evals folder', async () => {
		const files = {
			...testFolder(validTest(), { clean: { expect: 'pass', files: {} } }),
			[`${EVALS}/README.md`]: 'notes'
		};
		await inTempDir(files, () => {
			expect(loadEvalDefinitions('no-todo').map((definition) => definition.id)).toEqual(['clean']);
		});
	});

	test('throws one error listing every invalid file with its problems', async () => {
		const files = {
			...testFolder(validTest(), { clean: { expect: 'pass', files: {} } }),
			[`${EVALS}/bare/src/a.ts`]: 'ok',
			[`${EVALS}/odd/eval.yaml`]: 'expect: maybe\nnote: hi\n'
		};
		await inTempDir(files, () => {
			const load = () => loadEvalDefinitions('no-todo');
			expect(load).toThrow(/^2 of 3 eval\(s\) invalid:\n/);
			expect(load).toThrow(`${join(EVALS, 'bare/eval.yaml')}\n  Missing eval.yaml`);
			expect(load).toThrow(
				`${join(EVALS, 'odd/eval.yaml')}\n  expect: Expected pass, fail, or skip\n  note: Unknown field`
			);
		});
	});
});

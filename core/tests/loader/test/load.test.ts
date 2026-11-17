import { mkdirSync } from 'node:fs';
import { describe, expect, test } from 'bun:test';
import { loadDefinitions, loadTestFiles } from '../../../src/loader/test/load.ts';
import { testFolder, toYaml, validTest } from '../../helpers/fixtures.ts';
import { inTempDir } from '../../helpers/temp.ts';

const pathOf = (id: string): string => `.agents/tests/${id}/test.yaml`;

/** A Test with two problems: a duplicate assertion id and an invalid regular expression. */
const twoProblems = validTest({
	id: 'broken',
	assert: [
		{ id: 'dup', description: 'First.', error: 'First.', grep: '(' },
		{ id: 'dup', description: 'Second.', error: 'Second.', grep: 'TODO' }
	]
});

describe('loadTestFiles', () => {
	test('throws when the working directory has no .agents/tests folder', async () => {
		await inTempDir({ 'readme.md': 'hi' }, () => {
			expect(() => loadTestFiles()).toThrow('No .agents/tests/ folder in the current directory');
		});
	});

	test('throws when the .agents/tests folder is empty', async () => {
		await inTempDir({}, () => {
			mkdirSync('.agents/tests', { recursive: true });
			expect(() => loadTestFiles()).toThrow('No tests found in .agents/tests/');
		});
	});

	test('throws on an id that names no folder', async () => {
		await inTempDir(testFolder(validTest()), () => {
			expect(() => loadTestFiles('missing')).toThrow('Unknown test: missing');
		});
	});

	test('loads only the folder an id names', async () => {
		const files = { ...testFolder(validTest()), ...testFolder(validTest({ id: 'other' })) };
		await inTempDir(files, () => {
			expect(loadTestFiles('other')).toEqual([
				{ path: pathOf('other'), test: validTest({ id: 'other' }) }
			]);
		});
	});

	test.each([
		['beside a Test folder', { ...testFolder(validTest()), '.agents/tests/notes.md': 'x' }, 1],
		['when they are the only entries', { '.agents/tests/notes.md': 'x' }, 0]
	])('ignores files that are not directories %s', async (_name, files, count) => {
		await inTempDir(files, () => {
			if (count) expect(loadTestFiles().map(({ path }) => path)).toEqual([pathOf('no-todo')]);
			else expect(() => loadTestFiles()).toThrow('No tests found in .agents/tests/');
			expect(() => loadTestFiles('notes.md')).toThrow('Unknown test: notes.md');
		});
	});

	test('returns each file with its Test or its error when valid and invalid Tests sit together', async () => {
		const files = { ...testFolder(validTest()), ...testFolder(twoProblems) };
		await inTempDir(files, () => {
			expect(loadTestFiles()).toEqual([
				{
					path: pathOf('broken'),
					error: 'assert.1.id: Duplicate assertion id\nassert.0.grep: Invalid regular expression'
				},
				{ path: pathOf('no-todo'), test: validTest() }
			]);
		});
	});

	test('loads the folders sorted by name in code-point order, not locale order', async () => {
		const ids = ['b-rule', 'rule-9', 'a-rule', 'rule-10'];
		const files = {
			...Object.assign({}, ...ids.map((id) => testFolder(validTest({ id })))),
			'.agents/tests/Draft/TEST.md': 'No TODO.'
		};
		await inTempDir(files, () => {
			expect(loadTestFiles().map(({ path }) => path)).toEqual(
				['Draft', 'a-rule', 'b-rule', 'rule-10', 'rule-9'].map(pathOf)
			);
		});
	});

	test('returns an error when the id in test.yaml differs from its folder name', async () => {
		const files = { [pathOf('folder-name')]: toYaml(validTest({ id: 'yaml-id' })) };
		await inTempDir(files, () => {
			expect(loadTestFiles()).toEqual([
				{ path: pathOf('folder-name'), error: 'id: Must match the folder name "folder-name"' }
			]);
		});
	});

	test('returns an error pointing to compile when a folder has no test.yaml', async () => {
		await inTempDir({ '.agents/tests/draft/TEST.md': 'No TODO.' }, () => {
			expect(loadTestFiles()).toEqual([
				{ path: pathOf('draft'), error: 'Missing test.yaml; run `agentests compile draft`' }
			]);
		});
	});
});

describe('loadDefinitions', () => {
	test('returns the definitions sorted by folder name, as loadTestFiles loads them', async () => {
		const ids = ['b-test', 'a-test', 'c-test'];
		const files = Object.assign({}, ...ids.map((id) => testFolder(validTest({ id }))));
		await inTempDir(files, () => {
			expect(loadDefinitions()).toEqual(
				['a-test', 'b-test', 'c-test'].map((id) => validTest({ id }))
			);
			expect(loadDefinitions('a-test')).toEqual([validTest({ id: 'a-test' })]);
		});
	});

	test('throws one error naming every invalid file with its problems indented', async () => {
		const files = {
			...testFolder(validTest()),
			...testFolder(twoProblems),
			'.agents/tests/draft/TEST.md': 'No TODO.'
		};
		await inTempDir(files, () => {
			const error = (() => {
				try {
					loadDefinitions();
				} catch (caught) {
					return caught as Error;
				}
			})();
			expect(error).toBeInstanceOf(Error);
			const message = error!.message;
			expect(message.split('\n')[0]).toBe('2 of 3 test(s) invalid:');
			expect(message).toContain(
				`${pathOf('broken')}\n  assert.1.id: Duplicate assertion id\n  assert.0.grep: Invalid regular expression`
			);
			expect(message).toContain(
				`${pathOf('draft')}\n  Missing test.yaml; run \`agentests compile draft\``
			);
			expect(message).not.toContain(pathOf('no-todo'));
		});
	});
});

import { describe, expect, test } from 'bun:test';
import { parse } from 'yaml';
import { CountSchema, SelectorSchema, SelectorsSchema } from '../src/select/types.ts';

describe('selection grammar', () => {
	test('accepts file occurrence counts and directory child counts in YAML', () => {
		const document = parse(`
select:
  - id: effect-heavy-components
    from: files
    where:
      - path:
          glob: 'src/**/*.svelte'
      - content:
          grep: '\\$effect'
          count:
            more-or-equals: 11
      - content:
          ask: 'This file defines a UI component.'
  - id: crowded-route-folders
    from: directories
    where:
      - path:
          glob: 'src/routes/**'
      - content:
          ask: 'This folder looks like a feature module.'
      - children:
          from: files
          where:
            - path:
                glob: '*.svelte'
            - content:
                grep: '\\$effect'
          count:
            more-or-equals: 6
`);
		expect(SelectorsSchema.parse(document.select)).toEqual(document.select);
	});

	test('accepts unfiltered queries, empty selections, and nonrecursive directory children', () => {
		for (const from of ['files', 'directories']) {
			expect(SelectorSchema.safeParse({ id: 'all', from }).success).toBe(true);
			expect(SelectorSchema.safeParse({ id: 'all', from, where: [] }).success).toBe(true);
		}
		expect(SelectorsSchema.parse([])).toEqual([]);
		expect(
			SelectorSchema.safeParse({
				id: 'parents',
				from: 'directories',
				where: [
					{
						children: {
							from: 'directories',
							where: [{ content: { ask: 'This folder is a module.' } }]
						}
					}
				]
			}).success
		).toBe(true);
	});

	test.each([
		{ equals: 0 },
		{ 'different-from': 3 },
		{ 'more-than': 5 },
		{ 'less-than': 5 },
		{ 'more-or-equals': 2, 'less-or-equals': 8 }
	])('accepts count comparisons %j', (count) => {
		expect(CountSchema.safeParse(count).success).toBe(true);
	});

	test.each([
		{},
		{ equals: -1 },
		{ equals: 1.5 },
		{ equals: '2' },
		{ equals: Infinity },
		{ unknown: 1 }
	])('rejects invalid count %j', (count) => {
		expect(CountSchema.safeParse(count).success).toBe(false);
	});

	test.each([
		{ path: { glob: ['*.ts', '*.svelte'] } },
		{ path: { grep: ['component', 'module'] } },
		{ content: { grep: ['TODO', 'FIXME'] } },
		{ content: { ask: ['Is a module.', 'Is a component.'] } },
		{ content: { grep: 'TODO', count: { equals: 0 } } }
	])('accepts file condition %j', (condition) => {
		expect(
			SelectorSchema.safeParse({ id: 'example', from: 'files', where: [condition] }).success
		).toBe(true);
	});

	test.each([
		{ path: { ask: 'Is a module.' } },
		{ path: { glob: '*.ts', grep: 'TODO' } },
		{ path: { glob: '*.ts' }, content: { grep: 'TODO' } },
		{ path: [{ glob: '*.ts' }] },
		{ path: { grep: 'src', count: { equals: 0 } } },
		{ content: { glob: '*.ts' } },
		{ content: { ask: 'Is unfinished.', count: { equals: 0 } } },
		{ content: { grep: ['TODO', 'FIXME'], count: { equals: 0 } } },
		{ content: { grep: [] } },
		{ content: { ask: ' ' } },
		{ children: { from: 'files' } },
		{}
	])('rejects invalid file condition %j', (condition) => {
		expect(
			SelectorSchema.safeParse({ id: 'example', from: 'files', where: [condition] }).success
		).toBe(false);
	});

	test.each([
		{ path: { ask: 'Is a module.' } },
		{ content: { grep: 'TODO' } },
		{ children: { where: [] } },
		{ children: { id: 'nested', from: 'files' } },
		{ children: { from: 'directories', where: [{ children: { from: 'files' } }] } }
	])('rejects invalid directory condition %j', (condition) => {
		expect(
			SelectorSchema.safeParse({ id: 'example', from: 'directories', where: [condition] }).success
		).toBe(false);
	});

	test.each([
		{ from: 'files' },
		{ id: 'example' },
		{ id: 'Bad ID', from: 'files' },
		{ id: 'example', from: 'unknown' },
		{ id: 'example', from: 'files', description: 'Only an ID is required.' }
	])('rejects invalid selector %j', (selector) => {
		expect(SelectorSchema.safeParse(selector).success).toBe(false);
	});
});

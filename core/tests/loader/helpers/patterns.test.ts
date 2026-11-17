import { describe, expect, test } from 'bun:test';
import { globProblems, patterns } from '../../../src/loader/helpers/patterns.ts';

const hint = 'Globs cannot start with "!"; exclude with an extglob like "!(pattern)"';

describe('patterns', () => {
	test('returns nothing for a missing param', () => {
		expect(patterns('select.glob', undefined)).toEqual([]);
	});

	test('pairs a text param with the path itself', () => {
		expect(patterns('select.glob', 'src/**/*.ts')).toEqual([['select.glob', 'src/**/*.ts']]);
	});

	test('pairs each list item with the path and its index', () => {
		expect(patterns('select.glob', ['src/**', 'lib/**'])).toEqual([
			['select.glob.0', 'src/**'],
			['select.glob.1', 'lib/**']
		]);
	});
});

describe('globProblems', () => {
	test.each([
		['a missing param', undefined],
		['a plain glob', 'src/**/*.ts'],
		['a leading extglob', '!(dist)/**'],
		['a "!" after the start', 'src/!(*.test).ts']
	])('finds no problem in %s', (_name, param) => {
		expect(globProblems('select.glob', param)).toEqual([]);
	});

	test('reports a text glob starting with "!" at the path, with the extglob hint', () => {
		expect(globProblems('select.glob', '!dist/**')).toEqual([`select.glob: ${hint}`]);
	});

	test('reports each listed glob starting with "!" at its index', () => {
		expect(globProblems('ignore', ['src/**', '!dist/**', '!(tmp)/**', '!*.log'])).toEqual([
			`ignore.1: ${hint}`,
			`ignore.3: ${hint}`
		]);
	});
});

import { describe, expect, test } from 'bun:test';
import { LATEST_VERSION, validateTest } from '../../../src/loader/index.ts';
import { validTest } from '../../helpers/fixtures.ts';
import type { AgentTestDefinition } from '../../../src/loader/index.ts';

const ASSERTION = validTest().assert[0]!;

/** The lines of the error validateTest throws for the value, sorted; empty when it validates. */
const problemsOf = (value: unknown): string[] => {
	try {
		validateTest(value);
		return [];
	} catch (error) {
		return (error as Error).message.split('\n').sort();
	}
};

/** validTest with its one assertion changed by `fields`; undefined fields are removed. */
const withAssertion = (fields: Record<string, unknown>): Record<string, unknown> => ({
	...validTest(),
	assert: [JSON.parse(JSON.stringify({ ...ASSERTION, ...fields }))]
});

describe('validateTest', () => {
	test('a valid Test is returned as given', () => {
		expect(validateTest(validTest())).toStrictEqual(validTest());
	});

	test.each([
		['missing', undefined],
		['text', '1'],
		['a fraction', 1.5],
		['null', null]
	])('version is required as an integer (%s)', (_name, version) => {
		expect(problemsOf({ ...validTest(), version })).toEqual([
			'version: Required as an integer, e.g. `version: 1`'
		]);
	});

	test('a version newer than supported says to upgrade agent-tests', () => {
		expect(problemsOf({ ...validTest(), version: LATEST_VERSION + 1 })).toEqual([
			`version: ${LATEST_VERSION + 1} is newer than this package supports (${LATEST_VERSION}); upgrade agent-tests`
		]);
	});

	test.each([
		['the root', { ...validTest(), owner: 'me' }, 'owner'],
		['select', { ...validTest(), select: { glob: 'src/**', files: 'a' } }, 'select.files'],
		['an assertion', withAssertion({ severity: 'high' }), 'assert.0.severity']
	])('an unknown field is rejected at %s', (_name, value, path) => {
		expect(problemsOf(value)).toEqual([`${path}: Unknown field`]);
	});

	test.each(['No-Todo', 'no_todo', 'no todo', 'no--todo', '-no-todo', 'no-todo-', ''])(
		'an id must be lowercase kebab-case (%p is rejected)',
		(id) => {
			expect(problemsOf({ ...validTest(), id })).toEqual([
				'id: Expected a lowercase kebab-case id'
			]);
			expect(problemsOf(withAssertion({ id }))).toEqual([
				'assert.0.id: Expected a lowercase kebab-case id'
			]);
		}
	);

	test.each(['a', 'no-todo', 'rule-2-of-3'])('a lowercase kebab-case id (%p) is accepted', (id) => {
		expect(problemsOf({ ...validTest(), id })).toEqual([]);
	});

	test.each([
		['title', { ...validTest(), title: '  ' }, 'title'],
		['description', { ...validTest(), description: '' }, 'description'],
		['assertion description', withAssertion({ description: '\t' }), 'assert.0.description'],
		['assertion error', withAssertion({ error: ' \n ' }), 'assert.0.error']
	])('blank text is rejected (%s)', (_name, value, path) => {
		expect(problemsOf(value)).toEqual([`${path}: Must not be blank`]);
	});

	test('select is optional', () => {
		const withoutSelect = JSON.parse(
			JSON.stringify({ ...validTest(), select: undefined })
		) as AgentTestDefinition;
		expect(validateTest(withoutSelect)).toStrictEqual(withoutSelect);
	});

	test.each([
		['glob', { glob: 'src/**' }],
		['grep', { grep: 'TODO' }],
		['decide', { decide: 'Is it code?' }]
	])('select with only %s is accepted', (_name, select) => {
		expect(problemsOf({ ...validTest(), select })).toEqual([]);
	});

	test('select without glob, grep, or decide is rejected', () => {
		expect(problemsOf({ ...validTest(), select: {} })).toEqual([
			'select: Requires glob, grep, or decide'
		]);
	});

	test.each([
		['empty', []],
		['missing', undefined]
	])('assert must be a nonempty list (%s)', (_name, assert) => {
		const problems = problemsOf({ ...validTest(), assert });
		expect(problems).toHaveLength(1);
		expect(problems[0]).toStartWith('assert: ');
	});

	test.each(['id', 'description', 'error'])('an assertion requires %s', (field) => {
		const problems = problemsOf(withAssertion({ [field]: undefined }));
		expect(problems).toHaveLength(1);
		expect(problems[0]).toStartWith(`assert.0.${field}: `);
	});

	test.each([
		['grep', { grep: 'TODO' }],
		['decide', { grep: undefined, decide: 'Is there a TODO?' }],
		['reason', { grep: undefined, reason: 'Is work left unfinished?' }]
	])('an assertion with only %s is accepted', (_name, fields) => {
		expect(problemsOf(withAssertion(fields))).toEqual([]);
	});

	test('an assertion without grep, decide, or reason is rejected', () => {
		expect(problemsOf(withAssertion({ grep: undefined }))).toEqual([
			'assert.0: Requires grep, decide, or reason'
		]);
	});

	test('a duplicate assertion id is rejected at the repeat', () => {
		const assert = [ASSERTION, { ...ASSERTION, id: 'other' }, ASSERTION];
		expect(problemsOf({ ...validTest(), assert })).toEqual(['assert.2.id: Duplicate assertion id']);
	});

	test.each([
		['select.grep', { ...validTest(), select: { grep: '(' } }, 'select.grep'],
		['select.grep list', { ...validTest(), select: { grep: ['ok', '[a'] } }, 'select.grep.1'],
		['an assertion grep', withAssertion({ grep: '*TODO' }), 'assert.0.grep'],
		['an assertion grep list', withAssertion({ grep: ['TODO', 'a{2,1}'] }), 'assert.0.grep.1']
	])('an invalid regular expression in %s is rejected', (_name, value, path) => {
		expect(problemsOf(value)).toEqual([`${path}: Invalid regular expression`]);
	});

	test.each([
		['text', 'src/**/*.ts'],
		['a list', ['src/**/*.ts', 'lib/**/*.ts']]
	])('a param may be %s', (_name, glob) => {
		expect(validateTest({ ...validTest(), select: { glob } }).select?.glob).toEqual(glob);
	});

	test.each([
		['an empty list', []],
		['a number', 3],
		['a list holding blank text', ['src/**', ' ']],
		['blank text', '']
	])('a param may not be %s', (_name, glob) => {
		const problems = problemsOf({ ...validTest(), select: { glob } });
		expect(problems).toHaveLength(1);
		expect(problems[0]).toStartWith('select.glob');
	});

	test('several schema problems are all reported, one per line, as path: message', () => {
		const value = { ...validTest(), id: 'Bad', title: ' ', owner: 'me', select: {} };
		expect(problemsOf(value)).toEqual([
			'id: Expected a lowercase kebab-case id',
			'owner: Unknown field',
			'select: Requires glob, grep, or decide',
			'title: Must not be blank'
		]);
	});

	test('several rule problems are all reported, one per line, as path: message', () => {
		const value = {
			...validTest(),
			select: { grep: '(' },
			assert: [ASSERTION, { ...ASSERTION, grep: ')' }]
		};
		expect(problemsOf(value)).toEqual([
			'assert.1.grep: Invalid regular expression',
			'assert.1.id: Duplicate assertion id',
			'select.grep: Invalid regular expression'
		]);
	});

	test('a Test with a schema problem and a rule problem reports only the schema problem', () => {
		const value = { ...validTest(), owner: 'me', select: { grep: '(' } };
		expect(problemsOf(value)).toEqual(['owner: Unknown field']);
	});

	test('a Test with a valid schema reports every rule problem, a leading ! glob included', () => {
		const value = {
			...validTest(),
			select: { glob: ['src/**', '!src/gen/**'], grep: '(' },
			assert: [ASSERTION, ASSERTION]
		};
		expect(problemsOf(value)).toEqual([
			'assert.1.id: Duplicate assertion id',
			'select.glob.1: Globs cannot start with "!"; exclude with an extglob like "!(pattern)"',
			'select.grep: Invalid regular expression'
		]);
	});
});

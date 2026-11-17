import { describe, expect, test } from 'bun:test';
import { parseYaml } from '../../../src/loader/helpers/yaml.ts';

const billionLaughs = [
	'a: &a [x, x, x, x, x, x, x, x, x, x]',
	'b: &b [*a, *a, *a, *a, *a, *a, *a, *a, *a, *a]',
	'c: &c [*b, *b, *b, *b, *b, *b, *b, *b, *b, *b]',
	'd: &d [*c, *c, *c, *c, *c, *c, *c, *c, *c, *c]',
	'e: [*d, *d, *d, *d, *d, *d, *d, *d, *d, *d]'
].join('\n');

describe('parseYaml', () => {
	test('returns the value of a single document', () => {
		expect(parseYaml('id: no-todo\nlist:\n  - a\n  - b\n')).toEqual({
			id: 'no-todo',
			list: ['a', 'b']
		});
	});

	test('accepts a single document with a leading document marker', () => {
		expect(parseYaml('---\nid: no-todo\n')).toEqual({ id: 'no-todo' });
	});

	test.each([
		['empty text', ''],
		['only a comment', '# nothing here\n'],
		['two documents', 'a: 1\n---\nb: 2\n']
	])('rejects anything but exactly one document: %s', (_name, text) => {
		expect(() => parseYaml(text)).toThrow('Invalid YAML: expected exactly one document');
	});

	test('rejects duplicate keys with their position', () => {
		expect(() => parseYaml('a: 1\na: 2\n')).toThrow(
			'Invalid YAML at line 2, column 1: DUPLICATE_KEY'
		);
	});

	test.each([
		['an unterminated quote', 'ok: 1\nsecret: "s3cr3t-value\n', 3, 1],
		['an unclosed flow list', 'secret: [s3cr3t-value, ', 1, 24],
		['a nested implicit key', 'secret: s3cr3t: value\n', 1, 9]
	])(
		'reports a syntax error by line and column without echoing values: %s',
		(_name, text, line, column) => {
			let message = '';
			try {
				parseYaml(text);
			} catch (error) {
				message = (error as Error).message;
			}
			expect(message).toStartWith(`Invalid YAML at line ${line}, column ${column}: `);
			expect(message).not.toContain('s3cr3t');
		}
	);

	test('resolves a few aliases', () => {
		expect(parseYaml('a: &a 1\nb: *a\nc: *a\n')).toEqual({ a: 1, b: 1, c: 1 });
	});

	test.each([
		['exponential aliases', billionLaughs],
		['an undefined alias', 'a: *missing\n']
	])('rejects aliases it cannot resolve within its limits: %s', (_name, text) => {
		expect(() => parseYaml(text)).toThrow(
			'Invalid YAML: unable to resolve document aliases or keys'
		);
	});
});

import { describe, expect, it } from 'vitest';
import { parseTestDefinition, parseTestYaml } from './index.js';

const definition = () => ({
	id: 'no-informal-english',
	title: 'Formal English',
	description: 'Use formal English.',
	triggers: { path: { match: '**/*.ts' } },
	checks: [
		{ id: 'formal', message: 'Informal text', fix: 'Use formal text', fast: { match: 'hey' } }
	],
	evals: [{ name: 'greeting', path: 'a.ts', content: 'hey', expect: 'fail' }]
});

describe('strict test definitions', () => {
	it('accepts an executable definition without a compilation hash', () => {
		expect(parseTestDefinition(definition())).toEqual(definition());
	});

	it('rejects unknown fields at every nested level', () => {
		const variants = [
			{ ...definition(), extra: true },
			{ ...definition(), triggers: { unknown: {} } },
			{ ...definition(), triggers: { path: { match: '*', unknown: true } } },
			{ ...definition(), checks: [{ ...definition().checks[0], unknown: true }] },
			{ ...definition(), checks: [{ ...definition().checks[0], fast: { unknown: true } }] },
			{ ...definition(), checks: [{ ...definition().checks[0], smart: { ask: 'ok', extra: 1 } }] },
			{ ...definition(), checks: [{ ...definition().checks[0], deep: { ask: 'ok', extra: 1 } }] },
			{ ...definition(), evals: [{ ...definition().evals[0], unknown: true }] }
		];
		for (const value of variants) expect(() => parseTestDefinition(value)).toThrow('Invalid test');
	});

	it('rejects empty stages, invalid bounds and duplicate check ids', () => {
		expect(() => parseTestDefinition({ ...definition(), triggers: {} })).toThrow();
		expect(() => parseTestDefinition({ ...definition(), checks: [] })).toThrow();
		expect(() =>
			parseTestDefinition({
				...definition(),
				checks: [{ ...definition().checks[0], smart: { ask: 'ok', bounds: [0.8, 0.3] } }]
			})
		).toThrow();
		expect(() =>
			parseTestDefinition({
				...definition(),
				checks: [...definition().checks, ...definition().checks]
			})
		).toThrow();
	});

	it('accepts only valid source hashes', () => {
		const source = 'sha256:' + 'a'.repeat(64);
		expect(parseTestDefinition({ ...definition(), source }).source).toBe(source);
		expect(() => parseTestDefinition({ ...definition(), source: 'secret-value' })).toThrow();
	});
});

describe('YAML parsing', () => {
	it('preserves written order at both trigger and filter levels', () => {
		const text = [
			'id: ordered',
			'title: Ordered',
			'description: Written order matters',
			'triggers:',
			'  content:',
			'    ask: Is this relevant?',
			'    match: hello',
			'  path:',
			'    ask: Is this a source file?',
			"    match: '*.ts'",
			'checks:',
			'  - id: greeting',
			'    message: Informal greeting',
			'    fix: Rewrite',
			'    fast:',
			'      match: hello',
			'evals: []'
		].join('\n');
		const parsed = parseTestYaml(text);
		expect(Object.keys(parsed.triggers)).toEqual(['content', 'path']);
		if (Array.isArray(parsed.triggers)) throw new Error('Expected one trigger');
		expect(Object.keys(parsed.triggers.content!)).toEqual(['ask', 'match']);
		expect(Object.keys(parsed.triggers.path!)).toEqual(['ask', 'match']);
	});

	it('rejects duplicate YAML keys, aliases and multiple documents', () => {
		for (const text of ['id: first\nid: second', 'a: &value [1]\nb: *value', 'id: a\n---\nid: b'])
			expect(() => parseTestYaml(text)).toThrow('Invalid test YAML');
	});

	it('does not expose sensitive source text in parser errors', () => {
		expect(() => parseTestYaml('secret: [super-secret-key')).not.toThrow('super-secret-key');
		expect(() => parseTestDefinition({ ...definition(), id: 'super-secret-key!' })).not.toThrow(
			'super-secret-key'
		);
	});
});

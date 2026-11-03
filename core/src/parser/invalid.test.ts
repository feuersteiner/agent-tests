import { describe, expect, it } from 'vitest'
import { parseTestDefinition, parseTestYaml } from '../../index.ts'

const minimal = `
id: formal
title: Formal
description: Formal prose.
triggers:
  path:
    match: 'src/**'
checks:
  - id: prose
    message: Casual prose
    fix: Rewrite formally
    fast:
      match: gonna
evals: []
`

describe('invalid test definitions', () => {
	it.each([
		['root', { extra: true }],
		['trigger', { triggers: { path: { match: 'src/**' }, extra: true } }],
		['filter', { triggers: { content: { ask: 'Public?', extra: true } } }],
		['check', { checks: [{ id: 'x', message: 'm', fix: 'f', fast: { match: 'x' }, extra: true }] }],
		['fast', { checks: [{ id: 'x', message: 'm', fix: 'f', fast: { match: 'x', extra: true } }] }],
		['smart', { checks: [{
			id: 'x', message: 'm', fix: 'f', smart: { ask: 'Public?', extra: true }
		}] }],
		['deep', { checks: [{
			id: 'x', message: 'm', fix: 'f', deep: { ask: 'Public?', extra: true }
		}] }],
		['eval', { evals: [{ name: 'x', path: 'a.md', content: '', expect: 'pass', extra: true }] }]
	])('rejects unknown %s fields', (_level, override) => {
		expect(() => parseTestDefinition({ ...parseTestYaml(minimal), ...override }))
			.toThrow('Unrecognized key: "extra"')
	})

	it.each([
		['empty triggers', { triggers: [] }],
		['empty trigger', { triggers: {} }],
		['empty patterns', { triggers: { path: { match: [] } } }],
		['empty pattern', { triggers: { path: { match: ['src/**', ''] } } }],
		['blank title', { title: ' ' }],
		['blank prompt', { triggers: { path: { ask: ' ' } } }],
		['invalid id', { id: 'Bad_ID' }],
		['invalid check id', { checks: [{
			id: 'Bad_ID', message: 'm', fix: 'f', fast: { match: 'x' }
		}] }],
		['empty checks', { checks: [] }],
		['missing stage', { checks: [{ id: 'x', message: 'm', fix: 'f' }] }],
		['missing prompt', { checks: [{ id: 'x', message: 'm', fix: 'f', smart: {} }] }],
		['invalid source', { source: 'sha256:123' }],
		['invalid source prefix', { source: `SHA256:${'a'.repeat(64)}` }],
		['invalid label', { evals: [{ name: 'x', path: 'a.md', content: '', expect: 'warning' }] }],
		['invalid reasoning', { checks: [{
			id: 'x', message: 'm', fix: 'f', deep: { ask: 'Judge.', reasoning: 'max' }
		}] }],
		['invalid tiebreak', { checks: [{
			id: 'x', message: 'm', fix: 'f', fast: { match: 'x' }, 'human-tiebreak': 'yes'
		}] }]
	])('rejects %s', (_case, override) => {
		expect(() => parseTestDefinition({ ...parseTestYaml(minimal), ...override }))
			.toThrow('Invalid test definition:')
	})

	it.each([[-0.1, 0.8], [0.2, 1.1], [0.5, 0.5], [0.3], [0.3, 0.8, 1]])(
		'rejects invalid bounds %j', (...bounds) => {
			const value = parseTestYaml(minimal)
			const check = { ...value.checks[0], smart: { ask: 'Judge.', bounds } }
			expect(() => parseTestDefinition({ ...value, checks: [check] }))
				.toThrow('checks.0.smart.bounds')
		}
	)

	it('rejects non-object definitions and missing evals', () => {
		expect(() => parseTestDefinition(null)).toThrow('test:')
		const { evals, ...value } = parseTestYaml(minimal)
		expect(() => parseTestDefinition(value)).toThrow('evals:')
	})
})

describe('invalid YAML', () => {
	it('reports malformed YAML locations without echoing content', () => {
		expect(() => parseTestYaml('id: [private-input')).toThrow('Invalid YAML at line 1, column')
		expect(() => parseTestYaml('id: [private-input')).not.toThrow('private-input')
	})

	it('rejects duplicate keys at every nesting level', () => {
		expect(() => parseTestYaml(`${minimal}\nid: repeated`)).toThrow('DUPLICATE_KEY')
		const duplicate = minimal.replace('match: gonna', 'match: gonna\n      match: wanna')
		expect(() => parseTestYaml(duplicate))
			.toThrow('DUPLICATE_KEY')
	})

	it('rejects multiple or missing documents and unsupported tags', () => {
		expect(() => parseTestYaml(`${minimal}\n---\n${minimal}`))
			.toThrow('expected exactly one document')
		expect(() => parseTestYaml('')).toThrow('expected exactly one document')
		expect(() => parseTestYaml(minimal.replace('id: formal', 'id: !custom formal')))
			.toThrow('TAG_RESOLVE_FAILED')
	})
})

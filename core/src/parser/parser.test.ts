import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseTestDefinition, parseTestYaml } from '../../index.ts'
import type { AgentTest, Trigger } from '../../index.ts'
import type { Eval, TestOutcome } from 'agent-tests/types'

const example = (): AgentTest => ({
	id: 'formal-copy',
	title: 'Formal copy',
	description: 'Keep public text formal.',
	triggers: { path: { match: 'src/**/*.md' } },
	checks: [{
		id: 'formal', message: 'Casual copy', fix: 'Rewrite formally', fast: { match: 'gonna' }
	}],
	evals: []
})

describe('test definition parsing', () => {
	it('accepts the merged reference test', () => {
		const fixture = new URL('../../../library/no-informal-english/test.yaml', import.meta.url)
		const text = readFileSync(fixture, 'utf8')
		const result = parseTestYaml(text)
		expect(result.id).toBe('no-informal-english')
		expect(result.source).toMatch(/^sha256:[a-f\d]{64}$/)
		expect(result.checks[0]?.fast?.match).toBe('\\b([Gg]onna|[Ww]anna|[Gg]otta)\\b')
		expect(result.evals).toHaveLength(5)
	})

	it('accepts every stage, alternative triggers, and evaluation outcome', () => {
		const value = example()
		value.triggers = [
			{ path: { match: ['src/**', 'emails/**'], ask: 'Public path?' } },
			{ content: { ask: 'Public prose?', match: ['Acme', 'brand'] } }
		]
		value.checks[0] = {
			...value.checks[0]!,
			'human-tiebreak': true,
			fast: { maybe: ['hey', 'folks'], match: 'gonna' },
			smart: { ask: 'Quote casual phrases.', bounds: [0.3, 0.8] },
			deep: { ask: 'Judge these phrases.', reasoning: 'medium' }
		}
		const outcomes: TestOutcome[] = ['pass', 'fail', 'unsure', 'skip']
		value.evals = outcomes.map((expect): Eval => ({
			name: expect, path: 'empty.md', content: '', expect
		}))
		expect(parseTestDefinition(value)).toEqual(value)
		expect(parseTestDefinition(example())).not.toHaveProperty('source')
	})

	it('accepts whitespace patterns, threshold endpoints, and uppercase digest digits', () => {
		const value = example()
		value.source = `sha256:${'A'.repeat(64)}`
		value.checks[0]!.fast = { match: ' ' }
		value.checks[0]!.smart = { ask: 'Judge.', bounds: [0, 1] }
		expect(parseTestDefinition(value)).toEqual(value)
	})

	it('preserves written trigger and filter order without inserting defaults', () => {
		const result = parseTestYaml(`
id: ordered
title: Ordered
description: Preserve filter order.
triggers:
  content:
    ask: Public prose?
    match: Acme
  path:
    ask: Public path?
    match: 'src/**'
checks:
  - id: formal
    message: Casual prose
    fix: Rewrite formally
    deep:
      ask: Judge the prose.
evals: []
`)
		const trigger = result.triggers as Trigger
		expect(Object.keys(trigger)).toEqual(['content', 'path'])
		expect(Object.keys(trigger.content!)).toEqual(['ask', 'match'])
		expect(Object.keys(trigger.path!)).toEqual(['ask', 'match'])
		expect(result.checks[0]?.deep).toEqual({ ask: 'Judge the prose.' })
	})

	it('reports missing fields, duplicate check IDs, and bounds paths', () => {
		const { title, ...missing } = example()
		expect(() => parseTestDefinition(missing)).toThrow('title:')
		const duplicate = example()
		duplicate.checks.push({ ...duplicate.checks[0]! })
		expect(() => parseTestDefinition(duplicate)).toThrow('checks.1.id: Duplicate check id')
		const reversed = example()
		reversed.checks[0]!.smart = { ask: 'Judge.', bounds: [0.8, 0.3] }
		expect(() => parseTestDefinition(reversed)).toThrow('checks.0.smart.bounds:')
	})

	it('rejects empty filters and stages and wrong nested types with field paths', () => {
		expect(() => parseTestDefinition({ ...example(), triggers: { content: {} } }))
			.toThrow('triggers.content:')
		expect(() => parseTestDefinition({ ...example(), triggers: { content: { match: 42 } } }))
			.toThrow('triggers.content.match:')
		const emptyStage = example()
		emptyStage.checks[0]!.fast = {}
		expect(() => parseTestDefinition(emptyStage)).toThrow('checks.0.fast:')
	})
})

import { describe, expect, it } from 'vitest';
import { parseTestYaml } from '../schema/index.js';
import { evaluateTriggers } from './index.js';
import { mockModel, target } from './tests/fixtures.js';

describe('written trigger order', () => {
	it('preserves YAML content/path order and nested ask/match order', async () => {
		const definition = parseTestYaml(`
id: no-informal-english
title: No informal English
description: User-facing copy uses formal English.
triggers:
  content:
    ask: Is this user-facing copy?
    match: English
  path:
    ask: Is this a component?
    match: 'src/**/*.svelte'
checks:
  - id: formal-language
    message: Informal language appears.
    fix: Use formal English.
    fast:
      match: gonna
evals:
  - name: Informal button
    path: src/button.svelte
    content: gonna
    expect: fail
`);
		const model = mockModel([{ decision: 'pass' }, { decision: 'pass' }]);
		expect((await evaluateTriggers(definition.triggers, target, model)).matched).toBe(true);
		expect(model.decide.mock.calls.map(([request]) => request.ask)).toEqual([
			'Is this user-facing copy?',
			'Is this a component?'
		]);
		expect(model.decide.mock.calls[0]?.[0]).toMatchObject({
			path: target.path,
			content: target.content,
			level: 'trigger'
		});
		expect(model.decide.mock.calls[1]?.[0]).not.toHaveProperty('content');
	});

	it('runs ask before match when ask was written first, then stops on match failure', async () => {
		const model = mockModel([{ decision: 'pass' }]);
		const result = await evaluateTriggers(
			{ path: { ask: 'Is this a component?', match: 'content/**/*.md' } },
			target,
			model
		);
		expect(result.matched).toBe(false);
		expect(model.decide).toHaveBeenCalledTimes(1);
	});
});

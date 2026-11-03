import { describe, expect, it } from 'vitest';
import { evaluateTriggers } from './index.js';
import { mockModel, target } from './tests/fixtures.js';

describe('pattern triggers', () => {
	it('matches path globs and alternatives with directory boundaries and dotfiles', async () => {
		const trigger = { path: { match: ['content/**/*.md', 'src/**/*.svelte'] } };
		expect((await evaluateTriggers(trigger, target)).matched).toBe(true);
		expect(
			(await evaluateTriggers(trigger, { ...target, path: 'src/.private.svelte' })).matched
		).toBe(true);
		expect(
			(await evaluateTriggers(trigger, { ...target, path: 'scripts/button.svelte' })).matched
		).toBe(false);
	});

	it('matches any content regex without assuming case-insensitive matching', async () => {
		const trigger = { content: { match: ['French', 'English\\s+copy'] } };
		expect((await evaluateTriggers(trigger, target)).matched).toBe(true);
		expect((await evaluateTriggers({ content: { match: 'english' } }, target)).matched).toBe(false);
	});

	it('does not call a model after a failed path filter', async () => {
		const model = mockModel([]);
		const result = await evaluateTriggers(
			{ path: { match: 'content/**/*.md' }, content: { ask: 'Is this copy?' } },
			target,
			model
		);
		expect(result).toEqual({ matched: false, skipped: false, warnings: [] });
		expect(model.decide).not.toHaveBeenCalled();
	});

	it('does not call a model after a failed nested match filter', async () => {
		const model = mockModel([]);
		await evaluateTriggers({ content: { match: 'French', ask: 'Is this copy?' } }, target, model);
		expect(model.decide).not.toHaveBeenCalled();
	});

	it('stops alternatives after their first match', async () => {
		const model = mockModel([]);
		const result = await evaluateTriggers(
			[{ path: { match: 'src/**/*.svelte' } }, { content: { ask: 'Is this copy?' } }],
			target,
			model
		);
		expect(result.matched).toBe(true);
		expect(model.decide).not.toHaveBeenCalled();
	});

	it('reports invalid content regular expressions as configuration errors', async () => {
		await expect(evaluateTriggers({ content: { match: '[' } }, target)).rejects.toThrow(
			'Invalid content.match regular expression'
		);
	});
});

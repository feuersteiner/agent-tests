import { describe, expect, it } from 'vitest';
import { evaluateTriggers, selectTargets } from './index.js';
import { mockModel, referenceTest, target } from './tests/fixtures.js';

describe('trigger model outcomes', () => {
	it('distinguishes unavailable models from a rejected target', async () => {
		const result = await evaluateTriggers({ content: { ask: 'Is this copy?' } }, target);
		expect(result).toMatchObject({ matched: false, skipped: true });
		expect(result.warnings[0]).toContain('content.ask requires a model');
	});

	it('allows a later deterministic alternative to resolve missing-model selection', async () => {
		const result = await evaluateTriggers(
			[{ content: { ask: 'Is this copy?' } }, { path: { match: '**/*.svelte' } }],
			target
		);
		expect(result).toEqual({ matched: true, skipped: false, warnings: [] });
	});

	it('keeps unresolved alternatives when all model-free alternatives reject', async () => {
		const result = await evaluateTriggers(
			[{ content: { ask: 'Is this copy?' } }, { path: { match: '**/*.md' } }],
			target
		);
		expect(result.skipped).toBe(true);
		expect(result.matched).toBe(false);
	});

	it('treats unsure as unresolved and fail as a rejection', async () => {
		const trigger = { path: { ask: 'Is this a component?' } };
		const unsure = await evaluateTriggers(trigger, target, mockModel([{ decision: 'unsure' }]));
		const fail = await evaluateTriggers(trigger, target, mockModel([{ decision: 'fail' }]));
		expect(unsure).toMatchObject({ matched: false, skipped: true });
		expect(unsure.warnings[0]).toContain('was unsure');
		expect(fail).toEqual({ matched: false, skipped: false, warnings: [] });
	});

	it('sanitizes provider failures without treating them as passing or skipped', async () => {
		const model = {
			decide: async () => {
				throw new Error('secret-provider-value');
			}
		};
		await expect(
			evaluateTriggers({ path: { ask: 'Is this a component?' } }, target, model)
		).rejects.toThrow('Trigger model request failed');
	});

	it('selects reference-test eval targets without running checks', async () => {
		const selection = await selectTargets(
			referenceTest,
			referenceTest.evals.map(({ path, content }) => ({ path, content }))
		);
		expect(selection.targets.map(({ path }) => path)).toEqual([
			'src/button.svelte',
			'src/button.svelte'
		]);
		expect(selection.skipped).toEqual([]);
		expect(selection.warnings).toEqual([]);
	});

	it('reports unresolved targets separately from deterministic rejections', async () => {
		const definition = {
			...referenceTest,
			triggers: { path: { match: 'src/**/*.svelte' }, content: { ask: 'Is this copy?' } }
		};
		const selection = await selectTargets(definition, [target, { path: 'build.ts', content: '' }]);
		expect(selection.targets).toEqual([]);
		expect(selection.skipped).toEqual([target]);
		expect(selection.warnings).toHaveLength(1);
	});
});

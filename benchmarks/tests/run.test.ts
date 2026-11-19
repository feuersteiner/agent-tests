import { afterEach, expect, test } from 'bun:test';
import { createFakeDecider } from '../src/deciders.ts';
import { run } from '../src/run.ts';
import { installTap, withTap } from '../src/tap.ts';
import type { Case, Contender, Decision } from '../src/types.ts';

const contender = (id: string): Contender => ({
	id,
	label: id,
	decision: { api: 'openai', url: 'https://unused.invalid', model: id, apiKeyEnv: 'UNUSED' },
	price: { currency: 'USD', inputPerMillion: null, outputPerMillion: null, asOf: null }
});

const cases: Case[] = ['one', 'two', 'three'].map((name) => ({
	id: `hand-x/${name}`,
	test: 'hand-x',
	eval: name,
	tier: 'hand',
	category: 'copy',
	criterion: 'The text is fine.',
	path: 'a.md',
	content: name,
	expect: 'pass'
}));

const original = globalThis.fetch;
afterEach(() => {
	globalThis.fetch = original;
});

test('every contender answers every case in every repeat', async () => {
	const decisions: Decision[] = [];
	const passMs = await run({
		cases,
		contenders: ['a', 'b'].map((id) => ({
			contender: contender(id),
			decide: createFakeDecider(contender(id))
		})),
		repeats: 2,
		concurrency: 2,
		onDecision: (decision) => decisions.push(decision)
	});
	expect(decisions).toHaveLength(12);
	expect(passMs.a).toHaveLength(2);
	expect(
		new Set(decisions.map(({ contender: id, case: item, repeat }) => `${id} ${item} ${repeat}`))
			.size
	).toBe(12);
});

test('a call that throws is recorded and the run goes on', async () => {
	const decisions: Decision[] = [];
	await run({
		cases,
		contenders: [
			{
				contender: contender('a'),
				decide: async ({ eval: name }) => {
					if (name === 'two') throw new Error('refused');
					return 0.9;
				}
			}
		],
		repeats: 1,
		concurrency: 1,
		onDecision: (decision) => decisions.push(decision)
	});
	expect(decisions.map(({ error }) => error)).toEqual([undefined, 'refused', undefined]);
	expect(decisions[1]?.probability).toBeUndefined();
});

test('the tap keeps the usage of the calls made inside it and no others', async () => {
	globalThis.fetch = Object.assign(
		async () => Response.json({ usage: { input_tokens: 120, output_tokens: 3 } }),
		original
	);
	installTap();
	await fetch('https://unused.invalid/outside');
	const { http } = await withTap(async () => {
		await fetch('https://unused.invalid/inside');
	});
	expect(http).toHaveLength(1);
	expect(http[0]).toMatchObject({ status: 200, inputTokens: 120, outputTokens: 3 });
});

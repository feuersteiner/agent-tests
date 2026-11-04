import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { FastEngine } from '../../../index.ts';
import { FastEngineParamsSchema } from './index.ts';
import type { FastEngineParams } from './index.ts';

describe('FastEngine', () => {
	it.each<[string, FastEngineParams, number]>([
		['gonna ship', { match: 'gonna' }, 1],
		['gonna ship', { match: ['wanna', 'gonna'] }, 1],
		['hey there', { maybe: 'hey' }, 0.5],
		['hey there', { maybe: ['hello', 'hey'] }, 0.5],
		['Formal copy', { match: 'gonna', maybe: 'hey' }, 0],
		['Gonna ship', { match: 'gonna' }, 0],
		[' ', { match: ' ' }, 1],
		['gonna ship', { match: '\\b(gonna|wanna)\\b' }, 1],
		['begonna', { match: '\\b(gonna|wanna)\\b' }, 0]
	])('scores %s with %j as %s', async (input, params, expected) => {
		await expect(new FastEngine().run(input, params)).resolves.toBe(expected);
	});

	it('prioritizes match over maybe', async () => {
		await expect(new FastEngine().run('copy', { match: 'copy', maybe: 'copy' })).resolves.toBe(1);
	});

	it.each([
		{},
		{ match: '' },
		{ maybe: [] },
		{ match: ['copy', ''] },
		{ match: 1 },
		{ match: 'copy', flags: 'i' },
		{ match: 'copy', mode: 'regex' },
		{ match: 'copy', mode: 'glob' },
		{ match: 'copy', glob: 'src/**' }
	])('rejects invalid params %j through inherited validation', async (params) => {
		expect(FastEngineParamsSchema.safeParse(params).success).toBe(false);
		await expect(new FastEngine().run('copy', params as FastEngineParams)).rejects.toBeInstanceOf(
			z.ZodError
		);
	});

	it.each<FastEngineParams>([
		{ match: '[' },
		{ maybe: '(' },
		{ match: ['copy', '['] },
		{ match: 'copy', maybe: '[' },
		{ maybe: ['copy', '['] }
	])('rejects invalid regexes even behind matching patterns: %j', async (params) => {
		await expect(new FastEngine().run('copy', params)).rejects.toBeInstanceOf(SyntaxError);
	});

	it('keeps repeated regex calls independent', async () => {
		const engine = new FastEngine();
		const params: FastEngineParams = { match: 'copy' };
		const scores = [];
		for (const input of ['copy', 'copy', 'other', 'copy']) {
			scores.push(await engine.run(input, params));
		}
		expect(scores).toEqual([1, 1, 0, 1]);
	});
});

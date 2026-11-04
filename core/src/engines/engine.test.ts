import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { Engine } from './index.ts';

const ParamsSchema = z.strictObject({ label: z.string().trim().min(1) });
type Params = z.infer<typeof ParamsSchema>;

class TestEngine extends Engine<Params> {
	protected override readonly paramsSchema = ParamsSchema;

	constructor(private readonly scorer: (input: string, params: Params) => Promise<number>) {
		super();
	}

	protected override score(input: string, params: Params): Promise<number> {
		return this.scorer(input, params);
	}
}

describe('Engine', () => {
	it('passes input and normalized params to scoring without mutating params', async () => {
		const score = vi.fn().mockResolvedValue(0.5);
		const engine = new TestEngine(score);
		const params = { label: '  public copy  ' };
		await expect(engine.run('original input', params)).resolves.toBe(0.5);
		expect(score).toHaveBeenCalledExactlyOnceWith('original input', { label: 'public copy' });
		expect(params.label).toBe('  public copy  ');
	});

	it('rejects invalid params before calling score', async () => {
		const score = vi.fn().mockResolvedValue(0.5);
		const engine = new TestEngine(score);
		await expect(engine.run('input', { label: ' ' })).rejects.toBeInstanceOf(z.ZodError);
		expect(score).not.toHaveBeenCalled();
	});

	it.each([0, 0.25, 1])('returns a valid score of %s', async (value) => {
		const engine = new TestEngine(vi.fn().mockResolvedValue(value));
		await expect(engine.run('input', { label: 'copy' })).resolves.toBe(value);
	});

	it.each([-0.1, 1.1, NaN, Infinity, -Infinity])(
		'rejects an invalid score of %s',
		async (value) => {
			const engine = new TestEngine(vi.fn().mockResolvedValue(value));
			await expect(engine.run('input', { label: 'copy' })).rejects.toBeInstanceOf(z.ZodError);
		}
	);

	it('propagates the original scoring error', async () => {
		const error = new Error('Scoring failed');
		const engine = new TestEngine(vi.fn().mockRejectedValue(error));
		await expect(engine.run('input', { label: 'copy' })).rejects.toBe(error);
	});
});

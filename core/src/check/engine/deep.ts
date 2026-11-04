import type { z } from 'zod';
import type { AI } from '../../shared/ai/index.ts';
import { DeepCheckSchema } from '../../types/index.ts';
import { Engine } from './index.ts';

/** Shared deep-check prompt and optional reasoning level. */
export const DeepEngineParamsSchema = DeepCheckSchema;
export type DeepEngineParams = z.infer<typeof DeepEngineParamsSchema>;

/** Return support for the passing condition using an injected AI instance. */
export class DeepEngine extends Engine<DeepEngineParams> {
	/** Validate the prompt and optional reasoning level before calling AI. */
	protected override readonly paramsSchema = DeepEngineParamsSchema;

	constructor(private readonly ai: AI) {
		super();
	}

	/**
	 * Delegate input, prompt, and optional reasoning to injected AI.
	 * @returns Raw passing-condition score, validated by inherited run.
	 * @throws AI failures, as a rejected promise.
	 */
	protected override score(input: string, params: DeepEngineParams): Promise<number> {
		return this.ai.run({ input, ...params });
	}
}

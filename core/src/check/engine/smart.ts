import type { z } from 'zod';
import type { AI } from '../../ai/index.ts';
import { SmartCheckSchema } from '../../types/index.ts';
import { Engine } from './index.ts';

/** Shared smart-check prompt and optional score thresholds. */
export const SmartEngineParamsSchema = SmartCheckSchema;
export type SmartEngineParams = z.infer<typeof SmartEngineParamsSchema>;

/**
 * Return support for the passing condition; bounds are interpreted during check execution.
 * Provider setup belongs to the injected AI instance.
 */
export class SmartEngine extends Engine<SmartEngineParams> {
	/** Validate the prompt and optional bounds before calling AI. */
	protected override readonly paramsSchema = SmartEngineParamsSchema;

	constructor(private readonly ai: AI) {
		super();
	}

	/**
	 * Delegate input and prompt to injected AI without forwarding or applying bounds.
	 * @param input - Text to inspect.
	 * @param params - Validated prompt and optional bounds.
	 * @returns Raw AI score supporting the passing condition, validated by inherited run.
	 * @throws AI failures, as a rejected promise.
	 */
	protected override score(input: string, params: SmartEngineParams): Promise<number> {
		return this.ai.run({ input, ask: params.ask });
	}
}

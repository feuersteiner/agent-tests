import { AiConfigSchema, AiExplanationSchema, AiRequestSchema } from './types.ts';
import type { AiConfig, AiExplanation, AiRequest } from './types.ts';

export {
	AiConfigSchema,
	AiExplanationSchema,
	AiRequestSchema,
	FailInstanceSchema,
	ReasoningLevelSchema
} from './types.ts';
export type { AiConfig, AiExplanation, AiRequest, FailInstance, ReasoningLevel } from './types.ts';

/**
 * Abstract AI with validated, public readonly scoring and explanation operations.
 * Subclasses implement score and explainScore; ask always describes the passing condition.
 * SDK models and routing belong to concrete implementations, never this base.
 */
export abstract class AI {
	/**
	 * Validate request/config, invoke scoring, and validate the finite result in [0, 1].
	 * @param request - Source input, passing condition, and optional reasoning level.
	 * @param config - Optional system-instruction override, including an explicit empty string.
	 * @returns The subclass's passing-condition score.
	 * @throws Validation or scoring errors, as a rejected promise.
	 */
	public readonly run = async (request: AiRequest, config: AiConfig = {}): Promise<number> => {
		const parsedRequest = AiRequestSchema.parse(request);
		const parsedConfig = AiConfigSchema.parse(config);
		return AiExplanationSchema.shape.score.parse(await this.score(parsedRequest, parsedConfig));
	};

	/**
	 * Validate inputs and explanation output, preserving the score and grounding every quote.
	 * @param request - Original source and passing condition.
	 * @param score - Existing finite score in [0, 1], never recomputed by this wrapper.
	 * @param config - Optional system-instruction override.
	 * @returns A validated explanation with the unchanged score and exact source quotes.
	 * @throws Validation, changed-score, grounding, or implementation errors.
	 */
	public readonly explain = async (
		request: AiRequest,
		score: number,
		config: AiConfig = {}
	): Promise<AiExplanation> => {
		const parsedRequest = AiRequestSchema.parse(request);
		const parsedConfig = AiConfigSchema.parse(config);
		const originalScore = AiExplanationSchema.shape.score.parse(score);
		const explanation = AiExplanationSchema.parse(
			await this.explainScore(parsedRequest, originalScore, parsedConfig)
		);
		if (explanation.score !== originalScore) throw new Error('AI changed the supplied score');
		for (const failure of explanation.failures) {
			if (!parsedRequest.input.includes(failure.quote)) {
				throw new Error('AI returned a quote absent from the input');
			}
		}
		return explanation;
	};

	/** Compute a raw score from validated request/config; implementation failures propagate. */
	protected abstract score(request: AiRequest, config: AiConfig): Promise<number>;

	/** Explain the existing score using validated inputs, without rescoring or invented quotes. */
	protected abstract explainScore(
		request: AiRequest,
		score: number,
		config: AiConfig
	): Promise<AiExplanation>;
}

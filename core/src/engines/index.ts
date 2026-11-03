import { z } from 'zod'

/** A finite score between zero and one, inclusive. */
export const ScoreSchema = z.number().min(0).max(1)
export type Score = z.infer<typeof ScoreSchema>

/**
 * Abstract scoring engine; subclasses supply a parameter schema and score implementation.
 * Public readonly run validates params and the finite result in [0, 1].
 * Its promise rejects on validation failures or scoring errors.
 * @typeParam Params - Parameters accepted by the engine's schema.
 */
export abstract class Engine<Params> {
	/** Schema that validates and normalizes parameters before scoring. */
	protected abstract readonly paramsSchema: z.ZodType<Params>

	/**
	 * Validate parameters, execute scoring, and validate the result.
	 * @param input - Text to score.
	 * @param params - Engine-specific parameters.
	 * @returns A promise resolving to a finite score in [0, 1].
	 * @throws Validation or scoring errors, as a rejected promise.
	 */
	public readonly run = async (input: string, params: Params): Promise<number> => {
		const validated = this.paramsSchema.parse(params)
		return ScoreSchema.parse(await this.score(input, validated))
	}

	/** Compute a raw score from input and validated parameters. */
	protected abstract score(input: string, params: Params): Promise<number>
}

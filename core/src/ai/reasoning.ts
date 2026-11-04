import { generateText, Output } from 'ai';
import type { LanguageModel } from 'ai';
import { AI } from './index.ts';
import { AiExplanationSchema, FailInstanceSchema } from './types.ts';
import type { AiConfig, AiExplanation, AiRequest } from './types.ts';
import { EXPLAIN_SYSTEM_PROMPT, RUN_SYSTEM_PROMPT } from './prompts.ts';

const ReasoningScoreSchema = AiExplanationSchema.pick({ score: true });
const ReasoningEvidenceSchema = AiExplanationSchema.omit({ score: true }).extend({
	reason: AiExplanationSchema.shape.reason.unwrap().nullable(),
	failures: FailInstanceSchema.extend({
		reason: FailInstanceSchema.shape.reason.unwrap().nullable()
	}).array()
});

/** SDK reasoning implementation of abstract AI, with no default provider wiring. */
export class ReasoningAI extends AI {
	private readonly model: Exclude<LanguageModel, string>;

	/**
	 * @param model - SDK language-model instance supporting structured output.
	 */
	constructor(model: Exclude<LanguageModel, string>) {
		super();
		this.model = model;
	}

	/**
	 * Score support for ask as a passing condition; input remains untrusted data.
	 * @param request - Source input, passing condition, and optional SDK reasoning level.
	 * @param config - Optional system override; an empty string removes the default.
	 * @returns A validated finite score in [0, 1].
	 * @throws SDK errors; malformed or schema-invalid output is not retried.
	 */
	protected override async score(request: AiRequest, config: AiConfig): Promise<number> {
		const { input, ask, reasoning } = request;
		const system = config.system ?? RUN_SYSTEM_PROMPT;
		const result = await generateText({
			model: this.model,
			reasoning,
			output: Output.object({ schema: ReasoningScoreSchema }),
			system,
			prompt: JSON.stringify({ input, ask })
		});
		return result.output.score;
	}

	/**
	 * Explain the supplied score using exact quotes of instances failing ask.
	 * @param request - Original source and passing condition.
	 * @param score - Existing score, preserved without a scoring call.
	 * @param config - Optional system override; an empty string removes the default.
	 * @returns Failure quotes and optional reasons, grounded and validated by the base.
	 * @throws SDK errors; malformed or schema-invalid output is not retried.
	 */
	protected override async explainScore(
		request: AiRequest,
		score: number,
		config: AiConfig
	): Promise<AiExplanation> {
		const { input, ask, reasoning } = request;
		const system = config.system ?? EXPLAIN_SYSTEM_PROMPT;
		if (!input.trim()) return { score, failures: [] };
		const result = await generateText({
			model: this.model,
			reasoning,
			output: Output.object({ schema: ReasoningEvidenceSchema }),
			system,
			prompt: JSON.stringify({ input, ask, score })
		});
		const evidence = result.output;
		const failures = evidence.failures.map(({ quote, reason }) => {
			return { quote, ...(reason === null ? {} : { reason }) };
		});
		return {
			score,
			...(evidence.reason === null ? {} : { reason: evidence.reason }),
			failures
		};
	}
}

import { experimental_decide } from 'ai';
import type { Experimental_DecisionModel } from 'ai';
import { AI } from './index.ts';
import type { AiConfig, AiExplanation, AiRequest } from './types.ts';
import { DECISION_EXPLAIN_CRITERIA, EXPLAIN_SYSTEM_PROMPT, RUN_SYSTEM_PROMPT } from './prompts.ts';

/** Experimental SDK decision implementation of AI, with no default provider wiring. */
export class DecisionAI extends AI {
	private readonly model: Exclude<Experimental_DecisionModel, string>;

	/**
	 * @param model - SDK decision model supporting boolean and choice questions.
	 */
	constructor(model: Exclude<Experimental_DecisionModel, string>) {
		super();
		this.model = model;
	}

	/**
	 * Return P(true) for ask, which must describe the passing condition.
	 * @param request - Source input, passing condition, and optional SDK reasoning level.
	 * @param config - Optional system preamble; an empty string removes the default.
	 * @returns The validated boolean probability in [0, 1].
	 * @throws SDK errors.
	 */
	protected override async score(request: AiRequest, config: AiConfig): Promise<number> {
		const { input, ask, reasoning } = request;
		const system = config.system ?? RUN_SYSTEM_PROMPT;
		const result = await experimental_decide({
			model: this.model,
			reasoning,
			state: { input },
			questions: {
				criterion: {
					type: 'boolean',
					instructions: [system, ask].filter((value) => value.length).join('\n\n')
				}
			}
		});
		return result.answers.criterion.probability;
	}

	/**
	 * Classify original lines in one multi-question call without rerunning global scoring.
	 * @param request - Complete source and passing condition shared by all questions.
	 * @param score - Existing global score, preserved unchanged.
	 * @param config - Optional system preamble; native criteria and fragment IDs remain.
	 * @returns Original failing lines with no generated reasons or locations.
	 * @throws SDK errors, including invalid or missing fragment answers.
	 */
	protected override async explainScore(
		request: AiRequest,
		score: number,
		config: AiConfig
	): Promise<AiExplanation> {
		const { input, ask, reasoning } = request;
		const system = config.system ?? EXPLAIN_SYSTEM_PROMPT;
		const candidates = input
			.split(/\r\n|\n|\r/)
			.map((quote, index) => ({ id: `fragment_${index}`, quote }))
			.filter((candidate) => candidate.quote.trim().length > 0);
		if (!candidates.length) return { score, failures: [] };
		const questions = Object.fromEntries(
			candidates.map((candidate) => [
				candidate.id,
				{
					type: 'choice' as const,
					instructions: [
						system,
						DECISION_EXPLAIN_CRITERIA,
						`Passing condition: ${ask}`,
						`Fragment ID: ${candidate.id}`
					]
						.filter((value) => value.length)
						.join('\n\n'),
					criteria: { pass: null, fail: null }
				}
			])
		);
		const result = await experimental_decide({
			model: this.model,
			reasoning,
			state: { input, ask, score, candidates },
			questions
		});
		const failures = candidates
			.filter((candidate) => result.answers[candidate.id]!.choice === 'fail')
			.map(({ quote }) => ({ quote }));
		return { score, failures };
	}
}

import { createOpenAI } from '@ai-sdk/openai';
import { createTypeSafeAi } from '@ai-sdk/typesafe-ai';
import { experimental_decide } from 'ai';
import { AIEngine, providerSettings } from './ai.ts';
import { DECISION_EXPLAIN_CRITERIA } from './prompts.ts';
import type { AiRequest, AiSettings } from './types.ts';

/** Decide engine using one configured SDK model for scores and evidence. */
export class DecisionalAiEngine extends AIEngine {
	protected readonly model: ReturnType<ReturnType<typeof createOpenAI>['decisionModel']>;

	constructor(config: AiSettings['decision']) {
		super();
		const options = providerSettings(config);
		this.model =
			config.api === 'openai'
				? createOpenAI(options).decisionModel(config.model)
				: createTypeSafeAi(options).decisionModel(config.model);
	}

	protected override async score({ input, ask, reasoning }: AiRequest, system: string) {
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

	protected override async evidence(
		{ input, ask, reasoning }: AiRequest,
		score: number,
		system: string
	) {
		const candidates = input
			.split(/\r\n|\n|\r/)
			.map((quote, index) => ({ id: `fragment_${index}`, quote }))
			.filter((candidate) => candidate.quote.trim().length > 0);
		const result = await experimental_decide({
			model: this.model,
			reasoning,
			state: { input, ask, score, candidates },
			questions: Object.fromEntries(
				candidates.map(({ id }) => [
					id,
					{
						type: 'choice' as const,
						instructions: [
							system,
							DECISION_EXPLAIN_CRITERIA,
							`Passing condition: ${ask}`,
							`Fragment ID: ${id}`
						]
							.filter((value) => value.length)
							.join('\n\n'),
						criteria: { pass: null, fail: null }
					}
				])
			)
		});
		return {
			score,
			failures: candidates
				.filter((candidate) => result.answers[candidate.id]!.choice === 'fail')
				.map(({ quote }) => ({ quote }))
		};
	}
}

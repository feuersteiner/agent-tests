import { EXPLAIN_SYSTEM_PROMPT, RUN_SYSTEM_PROMPT } from '../prompts.ts';
import { AiConfigSchema, AiExplanationSchema, AiRequestSchema } from '../types.ts';
import type { AiConfig, AiExplanation, AiModelConfig, AiRequest } from '../types.ts';

/** Resolve provider credentials synchronously before any operation runs. */
export const providerSettings = (config: AiModelConfig) => {
	const apiKey = process.env[config.apiKeyEnv];
	if (!apiKey?.trim()) throw new Error(`Missing environment variable: ${config.apiKeyEnv}`);
	return { apiKey, baseURL: config.url.replace(/\/$/, '') };
};

/** Shared contracts for scoring passing conditions and explaining existing scores. */
export abstract class AIEngine {
	public readonly run = async (request: AiRequest, options: AiConfig = {}): Promise<number> => {
		const parsed = AiRequestSchema.parse(request);
		const system = AiConfigSchema.parse(options).system ?? RUN_SYSTEM_PROMPT;
		return AiExplanationSchema.shape.score.parse(await this.score(parsed, system));
	};

	public readonly explain = async (
		request: AiRequest,
		existingScore: number,
		options: AiConfig = {}
	): Promise<AiExplanation> => {
		const parsed = AiRequestSchema.parse(request);
		const system = AiConfigSchema.parse(options).system ?? EXPLAIN_SYSTEM_PROMPT;
		const score = AiExplanationSchema.shape.score.parse(existingScore);
		if (!parsed.input.trim()) return { score, failures: [] };
		const explanation = AiExplanationSchema.parse(await this.evidence(parsed, score, system));
		if (explanation.score !== score) throw new Error('AI changed the existing score');
		for (const { quote } of explanation.failures)
			if (!parsed.input.includes(quote))
				throw new Error('AI returned a quote absent from the input');

		return explanation;
	};

	protected abstract readonly score: (request: AiRequest, system: string) => Promise<number>;
	protected abstract readonly evidence: (
		request: AiRequest,
		score: number,
		system: string
	) => Promise<AiExplanation>;
}

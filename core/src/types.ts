import { z } from 'zod';

/** Lowercase kebab-case identifier. */
const IdSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Expected a lowercase kebab-case id');

/** Text with at least one non-whitespace character. */
const TextSchema = z.string().refine((value) => value.trim().length > 0, 'Must not be blank');

/** One param or a nonempty list; each engine defines how a list combines. */
export const AgentTestParamSchema = z.union([TextSchema, z.array(TextSchema).min(1)], {
	error: 'Expected text or a nonempty list of text'
});
export type AgentTestParam = z.infer<typeof AgentTestParamSchema>;

/** Filters that pick the sources a Test inspects; at least one is required. */
const SelectSchema = z
	.strictObject({
		glob: AgentTestParamSchema.optional(),
		grep: AgentTestParamSchema.optional(),
		decide: AgentTestParamSchema.optional()
	})
	.refine(
		(select) =>
			select.glob !== undefined || select.grep !== undefined || select.decide !== undefined,
		'Requires glob, grep, or decide'
	);

/** One escalating test running grep, then decide, then reason; at least one is required. */
const TestCaseSchema = z
	.strictObject({
		id: IdSchema,
		description: TextSchema,
		error: TextSchema,
		grep: AgentTestParamSchema.optional(),
		decide: AgentTestParamSchema.optional(),
		reason: AgentTestParamSchema.optional()
	})
	.refine(
		(test) => test.grep !== undefined || test.decide !== undefined || test.reason !== undefined,
		'Requires grep, decide, or reason'
	);

/** test.yaml at `version: 1`; optional fields have no implicit defaults. */
export const AgentTestSchema = z.strictObject({
	version: z.literal(1),
	id: IdSchema,
	title: TextSchema,
	description: TextSchema,
	select: SelectSchema.optional(),
	test: z.array(TestCaseSchema).min(1)
});
export type AgentTest = z.infer<typeof AgentTestSchema>;

/** One Test folder's test.yaml path, with either the loaded Test or the problems that stopped it from loading. */
export interface AgentTestDefinition {
	path: string;
	test?: AgentTest;
	error?: string;
}

/** A model endpoint and the environment variable holding its key, never the key itself. */
const ModelSchema = z.strictObject({
	url: z.url(),
	model: TextSchema,
	apiKeyEnv: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/, 'Expected an environment variable name')
});

/** A score threshold in [0, 1]. */
const ThresholdSchema = z.number().min(0).max(1);

/** agent-tests.config.yaml; both models are required even for Tests using only regexes. */
export const AgentTestConfigSchema = z.strictObject({
	ignore: z.array(TextSchema).default(['**/.git', '**/.agents', '**/node_modules']),
	decision: ModelSchema.extend({ api: z.enum(['openai', 'jev']) }),
	reasoning: ModelSchema.extend({ api: z.enum(['openai', 'anthropic']) }),
	select: z.strictObject({ threshold: ThresholdSchema }),
	test: z.strictObject({ threshold: ThresholdSchema })
});
export type AgentTestConfig = z.infer<typeof AgentTestConfigSchema>;

/** An engine score in [0, 1]. */
export const AgentTestScoreSchema = z.number().min(0).max(1);

/** The structured output the reasoning model must return. */
export const AgentTestReasoningOutputSchema = z.strictObject({ score: AgentTestScoreSchema });

/** Glob returns 0 or 1, AI returns a score in [0, 1], and grep returns an occurrence count. */
export type AgentTestEngine = (input: string, criteria: AgentTestParam) => Promise<number>;

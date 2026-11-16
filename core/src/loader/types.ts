import { z } from 'zod';
import { AgentTestParamSchema, IdSchema, TextSchema, ThresholdSchema } from '../types.ts';
import { EnginesConfigSchema } from '../engines/types.ts';
import { SelectConfigSchema, SelectSchema } from '../select/types.ts';

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

/** The config's `test` section: the score a test case needs to pass. */
const TestCaseConfigSchema = z.strictObject({ threshold: ThresholdSchema });
export type AgentTestCaseConfig = z.infer<typeof TestCaseConfigSchema>;

/** agent-tests.config.yaml; both models are required even for Tests using only regexes. */
export const AgentTestConfigSchema = z.strictObject({
	ignore: z.array(TextSchema).default(['**/.git', '**/.agents', '**/node_modules']),
	...EnginesConfigSchema.shape,
	select: SelectConfigSchema,
	test: TestCaseConfigSchema
});
export type AgentTestConfig = z.infer<typeof AgentTestConfigSchema>;

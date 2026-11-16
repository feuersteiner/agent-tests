import { z } from 'zod';
import { AgentTestParamSchema, IdSchema, TextSchema, ThresholdSchema } from '../types.ts';
import type { Source } from '../sources/index.ts';
import type { AgentTestDefinition } from '../loader/types.ts';

/** One escalating assertion running grep, then decide, then reason; at least one is required. */
const AssertionSchema = z
	.strictObject({
		id: IdSchema,
		description: TextSchema,
		error: TextSchema,
		grep: AgentTestParamSchema.optional(),
		decide: AgentTestParamSchema.optional(),
		reason: AgentTestParamSchema.optional()
	})
	.refine(
		(assertion) =>
			assertion.grep !== undefined ||
			assertion.decide !== undefined ||
			assertion.reason !== undefined,
		'Requires grep, decide, or reason'
	);
export type AgentTestAssertion = z.infer<typeof AssertionSchema>;

/** The assertions that judge each source a Test inspects; at least one is required. */
export const AssertSchema = z.array(AssertionSchema).min(1);
export type AgentTestAssert = z.infer<typeof AssertSchema>;

/** The config's `assert` section: the score a source needs to clear an assertion. */
export const AssertConfigSchema = z.strictObject({ threshold: ThresholdSchema });
export type AgentTestAssertConfig = z.infer<typeof AssertConfigSchema>;

/** One assertion that one source fails. */
export interface AgentTestFinding {
	source: Source;
	assertion: AgentTestAssertion;
}

/** One Test's outcome in a run: the Test and the findings against it. */
export interface AgentTestResult {
	test: AgentTestDefinition;
	findings: AgentTestFinding[];
}

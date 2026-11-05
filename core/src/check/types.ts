import { z } from 'zod';
import type { AI, ReasoningLevel } from '../shared/ai/index.ts';
import type { Source } from '../shared/source.ts';
import { IdSchema, ParamSchema, TextSchema } from '../shared/types.ts';
import type { Param } from '../shared/types.ts';

/** Caller-owned dependencies; ask uses the decision AI, reason the reasoning AI and level. */
export type CheckConfig = {
	threshold: number;
	reasoning?: ReasoningLevel;
	decisionAi: AI;
	reasoningAi: AI;
};

/** Fail function every rule implements: does this source fail the rule? */
export interface SourceRule {
	(source: Source, param: Param, config: CheckConfig): Promise<boolean>;
}

/** One described rule set escalating grep, then ask, then reason; at least one is required. */
export const CheckSchema = z
	.strictObject({
		id: IdSchema,
		description: TextSchema,
		error: TextSchema,
		grep: ParamSchema.optional(),
		ask: ParamSchema.optional(),
		reason: ParamSchema.optional()
	})
	.refine(
		(check) => check.grep !== undefined || check.ask !== undefined || check.reason !== undefined,
		'Requires grep, ask, or reason'
	);
export type Check = z.infer<typeof CheckSchema>;

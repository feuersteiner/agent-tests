import { z } from 'zod';
import type { AI } from '../shared/ai/index.ts';
import type { ReasoningLevel } from '../shared/ai/types.ts';
import type { Source } from '../shared/source.ts';
import { IdSchema, ParamSchema, TextSchema } from '../shared/types.ts';
import type { Param } from '../shared/types.ts';

/** Caller-owned AI; ask uses decide.run, reason uses reason.run and the configured level. */
export type CheckConfig = {
	threshold: number;
	reasoning?: ReasoningLevel;
	ai: AI;
};

/** Every rule answers "did this source fail?": true means it failed, false means it passed. */
export interface SourceRule {
	(source: Source, param: Param, config: CheckConfig, trace: string[]): Promise<boolean>;
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

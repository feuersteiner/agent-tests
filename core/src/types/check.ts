import { z } from 'zod'
import { id, PatternsSchema, text } from './primitives.ts'

const bounds = z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)])
	.refine(([lower, upper]) => lower < upper, 'Lower bound must be less than upper bound')

/** Pattern-only check stage. */
export const FastCheckSchema = z.strictObject({
	match: PatternsSchema.optional(),
	maybe: PatternsSchema.optional()
}).refine(
	value => value.match !== undefined || value.maybe !== undefined,
	'Requires match or maybe'
)
export type FastCheck = z.infer<typeof FastCheckSchema>

/** Classifier check stage with optional confidence thresholds. */
export const SmartCheckSchema = z.strictObject({ ask: text, bounds: bounds.optional() })
export type SmartCheck = z.infer<typeof SmartCheckSchema>

export const ReasoningLevelSchema = z.enum(['low', 'medium', 'high'])
export type ReasoningLevel = z.infer<typeof ReasoningLevelSchema>

/** Final model check stage. */
export const DeepCheckSchema = z.strictObject({
	ask: text,
	reasoning: ReasoningLevelSchema.optional()
})
export type DeepCheck = z.infer<typeof DeepCheckSchema>

/** A named rule with at least one check stage. */
export const CheckSchema = z.strictObject({
	id,
	message: text,
	fix: text,
	'human-tiebreak': z.boolean().optional(),
	fast: FastCheckSchema.optional(),
	smart: SmartCheckSchema.optional(),
	deep: DeepCheckSchema.optional()
}).refine(
	value => value.fast !== undefined || value.smart !== undefined || value.deep !== undefined,
	'Requires fast, smart, or deep'
)
export type Check = z.infer<typeof CheckSchema>

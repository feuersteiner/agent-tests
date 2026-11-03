import { z } from 'zod'

export const text = z.string().refine(value => value.trim().length > 0, 'Must not be blank')
export const id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Expected a lowercase kebab-case id')
const pattern = z.string().min(1)

/** One pattern or alternative patterns, in their written order. */
export const PatternsSchema = z.union([pattern, z.array(pattern).min(1)])
export type Patterns = z.infer<typeof PatternsSchema>

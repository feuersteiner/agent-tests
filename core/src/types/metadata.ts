import { z } from 'zod'
import { id, text } from './primitives.ts'

/** Test identity, description, and optional source digest. */
export const MetadataSchema = z.strictObject({
	id,
	title: text,
	description: text,
	source: z.string().regex(
		/^sha256:[a-fA-F\d]{64}$/,
		'Expected sha256: followed by 64 hexadecimal digits'
	).optional()
})
export type Metadata = z.infer<typeof MetadataSchema>

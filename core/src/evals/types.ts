import { z } from 'zod';
import { TextSchema } from '../shared/types.ts';

/** Expected result for a test's labeled file or directory example. */
export const TestOutcomeSchema = z.enum(['pass', 'fail', 'skip']);
export type TestOutcome = z.infer<typeof TestOutcomeSchema>;

export type EvalSource =
	{ path: string; content: string } | { path: string; children: EvalSource[] };
const FileExampleSchema = z.strictObject({ path: TextSchema, content: z.string() });
const SourceExampleSchema: z.ZodType<EvalSource> = z.lazy(() =>
	z.union([
		FileExampleSchema,
		z.strictObject({ path: TextSchema, children: z.array(SourceExampleSchema) })
	])
);

/** File content or a directory tree; child paths are repository-relative. */
export const EvalSchema = z.union([
	FileExampleSchema.extend({ name: TextSchema, expect: TestOutcomeSchema }),
	z.strictObject({
		name: TextSchema,
		path: TextSchema,
		children: z.array(SourceExampleSchema),
		expect: TestOutcomeSchema
	})
]);
export type Eval = z.infer<typeof EvalSchema>;

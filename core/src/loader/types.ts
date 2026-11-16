import { z } from 'zod';
import { IdSchema, TextSchema } from '../types.ts';
import { EnginesConfigSchema } from '../engines/types.ts';
import { SelectConfigSchema, SelectSchema } from '../select/types.ts';
import { AssertConfigSchema, AssertSchema } from '../assert/types.ts';

/** test.yaml at `version: 1`; optional fields have no implicit defaults. */
export const AgentTestSchema = z.strictObject({
	version: z.literal(1),
	id: IdSchema,
	title: TextSchema,
	description: TextSchema,
	select: SelectSchema.optional(),
	assert: AssertSchema
});
export type AgentTestDefinition = z.infer<typeof AgentTestSchema>;

/** One Test folder's test.yaml path, with either the loaded Test or the problems that stopped it from loading. */
export interface AgentTestFile {
	path: string;
	test?: AgentTestDefinition;
	error?: string;
}

/** agent-tests.config.yaml; both models are required even for Tests using only regexes. */
export const AgentTestConfigSchema = z.strictObject({
	ignore: z.array(TextSchema).default(['**/.git', '**/.agents', '**/node_modules']),
	...EnginesConfigSchema.shape,
	select: SelectConfigSchema,
	assert: AssertConfigSchema
});
export type AgentTestConfig = z.infer<typeof AgentTestConfigSchema>;

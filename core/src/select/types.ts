import { z } from 'zod';
import type { EngineSet } from '../shared/engines/types.ts';
export type { EngineSet } from '../shared/engines/types.ts';
import { ParamSchema } from '../shared/types.ts';
import type { Param } from '../shared/types.ts';
import type { TypedSource } from '../shared/source.ts';

/** Each nested step filters within directories retained by its parent. */
export type SelectStep = { glob?: Param; grep?: Param; ask?: Param; where?: SelectStep };
export const SelectStepSchema: z.ZodType<SelectStep> = z.lazy(() =>
	z.strictObject({
		glob: ParamSchema.optional(),
		grep: ParamSchema.optional(),
		ask: ParamSchema.optional(),
		where: SelectStepSchema.optional()
	})
);

/** The root type is mandatory and describes final targets, not intermediate scopes. */
export const SelectSchema = z.strictObject({
	type: z.enum(['files', 'directories']),
	glob: ParamSchema.optional(),
	grep: ParamSchema.optional(),
	ask: ParamSchema.optional(),
	where: SelectStepSchema.optional()
});
export type Select = z.infer<typeof SelectSchema>;
export type SelectConfig = { threshold: number; engines: EngineSet };
export type SelectEntry = {
	source: TypedSource;
	check: SelectStep;
	flagged: boolean;
	trace: string[];
};
export type SelectResult = { flagged: SelectEntry[]; cleared: SelectEntry[] };

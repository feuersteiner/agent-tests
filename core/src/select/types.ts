import { z } from 'zod';
import { IdSchema, ParamSchema, TextSchema } from '../shared/types.ts';

const CountValueSchema = z.number().int().nonnegative();

/** AND comparisons against regex occurrences or matching immediate children. */
export const CountSchema = z
	.strictObject({
		equals: CountValueSchema.optional(),
		'different-from': CountValueSchema.optional(),
		'more-than': CountValueSchema.optional(),
		'less-than': CountValueSchema.optional(),
		'more-or-equals': CountValueSchema.optional(),
		'less-or-equals': CountValueSchema.optional()
	})
	.refine(
		(count) => Object.values(count).some((value) => value !== undefined),
		'Requires at least one count comparison'
	);
export type Count = z.infer<typeof CountSchema>;

/** Exactly one engine reads the path; patterns within an engine combine with OR. */
export const PathConditionSchema = z.strictObject({
	path: z.union([z.strictObject({ glob: ParamSchema }), z.strictObject({ grep: ParamSchema })])
});
export type PathCondition = z.infer<typeof PathConditionSchema>;

/** Counted grep uses one regex; omitted count means at least one occurrence. */
export const FileContentConditionSchema = z.strictObject({
	content: z.union([
		z.strictObject({ grep: ParamSchema }),
		z.strictObject({ grep: TextSchema, count: CountSchema }),
		z.strictObject({ ask: ParamSchema })
	])
});
export type FileContentCondition = z.infer<typeof FileContentConditionSchema>;

/** Directory content is its immediate tree and child metadata, consumed by ask. */
export const DirectoryContentConditionSchema = z.strictObject({
	content: z.strictObject({ ask: ParamSchema })
});
export type DirectoryContentCondition = z.infer<typeof DirectoryContentConditionSchema>;

const FileWhereSchema = z.array(z.union([PathConditionSchema, FileContentConditionSchema]));
const DirectoryWhereSchema = z.array(
	z.union([PathConditionSchema, DirectoryContentConditionSchema])
);

/** Omitted or empty where accepts every target of the requested kind. */
const FileQuerySchema = z.strictObject({
	from: z.literal('files'),
	where: FileWhereSchema.optional()
});
const DirectoryQuerySchema = z.strictObject({
	from: z.literal('directories'),
	where: DirectoryWhereSchema.optional()
});

/** Queries immediate children and retains the parent; omitted count means at least one. */
export const ChildrenConditionSchema = z.strictObject({
	children: z.discriminatedUnion('from', [
		FileQuerySchema.extend({ count: CountSchema.optional() }),
		DirectoryQuerySchema.extend({ count: CountSchema.optional() })
	])
});
export type ChildrenCondition = z.infer<typeof ChildrenConditionSchema>;

/** AND conditions; only top-level directory queries may inspect children. */
export const SelectorSchema = z.discriminatedUnion('from', [
	FileQuerySchema.extend({ id: IdSchema }),
	DirectoryQuerySchema.extend({
		id: IdSchema,
		where: z
			.array(
				z.union([PathConditionSchema, DirectoryContentConditionSchema, ChildrenConditionSchema])
			)
			.optional()
	})
]);
export type Selector = z.infer<typeof SelectorSchema>;

/** OR selectors, deduplicating targets; an empty list selects nothing. */
export const SelectorsSchema = z.array(SelectorSchema);
export type Selectors = z.infer<typeof SelectorsSchema>;

import { z } from 'zod';

const text = z.string().min(1);
const id = text.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const patterns = z.union([text, z.array(text).min(1)]);
const nonempty = (value: object) => Object.keys(value).length > 0;

const filter = z
	.object({ match: patterns.optional(), ask: text.optional() })
	.strict()
	.refine(nonempty);
const trigger = z
	.object({ path: filter.optional(), content: filter.optional() })
	.strict()
	.refine(nonempty);
const fast = z
	.object({ match: patterns.optional(), maybe: patterns.optional() })
	.strict()
	.refine(nonempty);
const bounds = z
	.tuple([z.number().min(0).max(1), z.number().min(0).max(1)])
	.refine(([low, high]) => low < high, 'Bounds must be increasing');
const smart = z.object({ ask: text, bounds: bounds.optional() }).strict();
const deep = z
	.object({ ask: text, reasoning: z.enum(['low', 'medium', 'high']).optional() })
	.strict();
const check = z
	.object({
		id,
		message: text,
		fix: text,
		'human-tiebreak': z.boolean().optional(),
		fast: fast.optional(),
		smart: smart.optional(),
		deep: deep.optional()
	})
	.strict()
	.refine((value) => Boolean(value.fast || value.smart || value.deep), 'A check needs a level');
const example = z
	.object({
		name: text,
		path: text,
		content: z.string(),
		expect: z.enum(['pass', 'fail', 'unsure', 'skip'])
	})
	.strict();

/** Strict structural validator; callers retain original objects to preserve YAML key order. */
export const definitionSchema = z
	.object({
		id,
		title: text,
		description: text,
		source: z
			.string()
			.regex(/^sha256:[a-f0-9]{64}$/)
			.optional(),
		triggers: z.union([trigger, z.array(trigger).min(1)]),
		checks: z.array(check).min(1),
		evals: z.array(example)
	})
	.strict()
	.refine(
		(value) => new Set(value.checks.map((item) => item.id)).size === value.checks.length,
		'Check ids must be unique'
	);

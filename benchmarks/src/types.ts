import { z } from 'zod';

/** Where a benchmark Test's cases come from: written for this benchmark, or imported from a linter's own tests. */
export const TierSchema = z.enum(['hand', 'linter']);
export type Tier = z.infer<typeof TierSchema>;

/** The kind of file a benchmark Test judges. */
export const CategorySchema = z.enum(['copy', 'docs', 'code', 'config', 'business']);
export type Category = z.infer<typeof CategorySchema>;

/** `benchmark.yaml`, next to a Test's `test.yaml`: the provenance of its cases. */
export const BenchmarkMetaSchema = z.strictObject({
	tier: TierSchema,
	category: CategorySchema,
	source: z.string().min(1),
	licence: z.string().min(1),
	url: z.url().optional(),
	commit: z.string().min(7).optional()
});
export type BenchmarkMeta = z.infer<typeof BenchmarkMetaSchema>;

/** A price per million tokens; null until the owner reads it from the provider's price page. */
const PriceSchema = z.strictObject({
	currency: z.string().min(1),
	inputPerMillion: z.number().nonnegative().nullable(),
	outputPerMillion: z.number().nonnegative().nullable(),
	asOf: z.string().nullable()
});
export type Price = z.infer<typeof PriceSchema>;

/** One decision model under comparison: the config's `decision` section, a label and a price. */
const ContenderSchema = z.strictObject({
	id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
	label: z.string().min(1),
	decision: z.strictObject({
		api: z.enum(['openai', 'jev']),
		url: z.url(),
		model: z.string().min(1),
		apiKeyEnv: z.string().min(1)
	}),
	price: PriceSchema
});
export type Contender = z.infer<typeof ContenderSchema>;

/** `contenders.yaml`: the models compared and the one threshold they share. */
export const ContendersSchema = z.strictObject({
	threshold: z.number().min(0).max(1),
	contenders: z.array(ContenderSchema).min(1)
});
export type Contenders = z.infer<typeof ContendersSchema>;

/** One labelled decision: a file, a criterion and the verdict a careful reviewer gives. */
export interface Case {
	/** `<test>/<eval>`, unique in the dataset. */
	id: string;
	test: string;
	eval: string;
	tier: Tier;
	category: Category;
	criterion: string;
	/** The one file of the eval folder, relative to it. */
	path: string;
	content: string;
	expect: 'pass' | 'fail';
}

/** What the fetch tap saw of one HTTP call made while a decision was pending. */
export interface HttpCall {
	ms: number;
	status: number;
	inputTokens?: number;
	outputTokens?: number;
}

/** One line of `decisions.jsonl`: one model's answer to one case in one repeat. */
export interface Decision {
	contender: string;
	case: string;
	test: string;
	tier: Tier;
	category: Category;
	expect: 'pass' | 'fail';
	repeat: number;
	/** The probability the model gave to "passes"; absent when the call threw. */
	probability?: number;
	latencyMs: number;
	http: HttpCall[];
	error?: string;
}

/** `run.json`: what a run compared and under which conditions. */
export interface RunInfo {
	dryRun: boolean;
	startedAt: string;
	finishedAt: string;
	repeats: number;
	concurrency: number;
	threshold: number;
	commit: string;
	datasetHash: string;
	promptHash: string;
	runtime: string;
	cases: number;
	contenders: (Omit<Contender, 'decision'> & { model: string; api: string; url: string })[];
	/** Wall-clock milliseconds of each full pass over the dataset, by contender, in repeat order. */
	passMs: Record<string, number[]>;
}

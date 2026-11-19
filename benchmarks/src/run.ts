import { withTap } from './tap.ts';
import type { Decider } from './deciders.ts';
import type { Case, Contender, Decision } from './types.ts';

/** What a run needs: the cases, the contenders with their deciders, and how often and how wide to ask. */
export interface RunOptions {
	cases: Case[];
	contenders: { contender: Contender; decide: Decider }[];
	repeats: number;
	concurrency: number;
	/** Called with each decision as it lands, in completion order. */
	onDecision: (decision: Decision) => void;
}

/** Runs `work` on every item with at most `limit` pending at once. */
const pool = async <T>(
	items: T[],
	limit: number,
	work: (item: T) => Promise<void>
): Promise<void> => {
	let next = 0;
	const worker = async (): Promise<void> => {
		while (next < items.length) await work(items[next++]!);
	};
	await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
};

/** One model's answer to one case, timed; a thrown call becomes a decision with an `error`. */
const decideCase = async (
	{ contender, decide }: RunOptions['contenders'][number],
	item: Case,
	repeat: number
): Promise<Decision> => {
	const base = {
		contender: contender.id,
		case: item.id,
		test: item.test,
		tier: item.tier,
		category: item.category,
		expect: item.expect,
		repeat
	};
	const started = performance.now();
	try {
		const { result, http } = await withTap(() => decide(item, repeat));
		return { ...base, probability: result, latencyMs: performance.now() - started, http };
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return { ...base, latencyMs: performance.now() - started, http: [], error: message };
	}
};

/**
 * Asks every contender every case, `repeats` times. Contenders take turns within each repeat, so a
 * slow hour at one provider does not land on a single contender's whole run. Returns the wall-clock
 * milliseconds of each full pass over the dataset, by contender, in repeat order.
 */
export const run = async (options: RunOptions): Promise<Record<string, number[]>> => {
	const passMs: Record<string, number[]> = {};
	for (let repeat = 1; repeat <= options.repeats; repeat++)
		for (const entry of options.contenders) {
			const started = performance.now();
			await pool(options.cases, options.concurrency, async (item) =>
				options.onDecision(await decideCase(entry, item, repeat))
			);
			(passMs[entry.contender.id] ??= []).push(performance.now() - started);
		}
	return passMs;
};

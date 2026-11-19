import type { Contender, Decision, Price } from './types.ts';

/** The share of `values` that are true; undefined when there are none. */
const share = (values: boolean[]): number | undefined =>
	values.length ? values.filter(Boolean).length / values.length : undefined;

const mean = (values: number[]): number | undefined =>
	values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : undefined;

/** The value at quantile `q` of `values`, by the nearest-rank method. */
const quantile = (values: number[], q: number): number | undefined => {
	if (!values.length) return undefined;
	const sorted = [...values].sort((a, b) => a - b);
	return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1))];
};

/** A small seeded generator, so a report's confidence intervals are the same on every build. */
const seeded = (seed: number) => (): number => {
	seed = (seed + 0x6d2b79f5) | 0;
	let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
	t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
	return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32;
};

/** The 95% interval of the mean of `values`, by resampling the cases 2,000 times. */
const interval = (values: number[]): [number, number] | undefined => {
	if (values.length < 2) return undefined;
	const random = seeded(values.length);
	const means = Array.from({ length: 2000 }, () => {
		let sum = 0;
		for (let index = 0; index < values.length; index++)
			sum += values[Math.floor(random() * values.length)]!;
		return sum / values.length;
	});
	return [quantile(means, 0.025)!, quantile(means, 0.975)!];
};

/** The verdict a probability gives at a threshold, as the assert orchestrator reads it. */
export const toVerdict = (probability: number, threshold: number): 'pass' | 'fail' =>
	probability >= threshold ? 'pass' : 'fail';

/** One case's answered repeats for one contender. */
interface CaseAnswers {
	case: string;
	expect: 'pass' | 'fail';
	probabilities: number[];
}

/** The answered decisions grouped by case, in first-seen order. */
const byCase = (decisions: Decision[]): CaseAnswers[] => {
	const cases = new Map<string, CaseAnswers>();
	for (const decision of decisions) {
		if (decision.probability === undefined) continue;
		const entry = cases.get(decision.case) ?? {
			case: decision.case,
			expect: decision.expect,
			probabilities: []
		};
		entry.probabilities.push(decision.probability);
		cases.set(decision.case, entry);
	}
	return [...cases.values()];
};

/** Accuracy and the two error rates at one threshold; each case weighs the same however many repeats answered. */
const rates = (cases: CaseAnswers[], threshold: number) => {
	const correct = cases.map(({ expect, probabilities }) =>
		share(probabilities.map((probability) => toVerdict(probability, threshold) === expect))!
	);
	const wrongAmong = (label: 'pass' | 'fail'): number | undefined =>
		mean(
			cases
				.filter(({ expect }) => expect === label)
				.map(({ probabilities }) =>
					share(probabilities.map((probability) => toVerdict(probability, threshold) !== label))!
				)
		);
	return {
		accuracy: mean(correct),
		accuracyInterval: interval(correct),
		falseBlockRate: wrongAmong('pass'),
		missedRate: wrongAmong('fail')
	};
};

/** The cost of 1,000 decisions at the mean reported usage, or undefined without usage or a price. */
const toCost = (input?: number, output?: number, price?: Price): number | undefined => {
	if (input === undefined || output === undefined) return undefined;
	if (!price || price.inputPerMillion === null || price.outputPerMillion === null) return undefined;
	return ((input * price.inputPerMillion + output * price.outputPerMillion) / 1e6) * 1000;
};

/** Every metric of one contender over one slice of the decisions. */
export const summarize = (decisions: Decision[], threshold: number, price?: Price) => {
	const answered = decisions.filter((decision) => decision.probability !== undefined);
	const cases = byCase(decisions);
	const repeated = cases.filter(({ probabilities }) => probabilities.length > 1);
	const latencies = answered.map((decision) => decision.latencyMs);
	const tokens = (key: 'inputTokens' | 'outputTokens'): number | undefined =>
		mean(
			answered
				.filter(({ http }) => http.some((call) => call[key] !== undefined))
				.map(({ http }) => http.reduce((sum, call) => sum + (call[key] ?? 0), 0))
		);
	const inputTokens = tokens('inputTokens');
	const outputTokens = tokens('outputTokens');
	return {
		cases: cases.length,
		decisions: decisions.length,
		errors: decisions.length - answered.length,
		...rates(cases, threshold),
		flipRate: share(
			repeated.map(
				({ probabilities }) =>
					new Set(probabilities.map((probability) => toVerdict(probability, threshold))).size > 1
			)
		),
		brier: mean(
			answered.map(({ probability, expect }) => (probability! - (expect === 'pass' ? 1 : 0)) ** 2)
		),
		latencyP50: quantile(latencies, 0.5),
		latencyP95: quantile(latencies, 0.95),
		latencyMean: mean(latencies),
		inputTokens,
		outputTokens,
		costPer1000: toCost(inputTokens, outputTokens, price)
	};
};
export type Summary = ReturnType<typeof summarize>;

/** Accuracy and the two error rates at every threshold from 0.05 to 0.95. */
export const sweep = (decisions: Decision[]) => {
	const cases = byCase(decisions);
	return Array.from({ length: 19 }, (_, index) => {
		const threshold = (index + 1) / 20;
		const { accuracy, falseBlockRate, missedRate } = rates(cases, threshold);
		return { threshold, accuracy, falseBlockRate, missedRate };
	});
};

/** The probability of a split at least as uneven as `a` against `b` if both sides were equally likely. */
const signTest = (a: number, b: number): number => {
	const n = a + b;
	if (!n) return 1;
	let coefficient = 1;
	let tail = 0;
	for (let k = 0; k <= Math.min(a, b); k++) {
		tail += coefficient;
		coefficient = (coefficient * (n - k)) / (k + 1);
	}
	return Math.min(1, (2 * tail) / 2 ** n);
};

/**
 * The two contenders case by case, each taken at its mean probability over the repeats: how many
 * cases both, neither or only one got right, the sign test on the cases that split them, and those
 * cases themselves.
 */
export const compare = (
	decisions: Decision[],
	first: string,
	second: string,
	threshold: number
) => {
	const consensus = (contender: string): Map<string, boolean> =>
		new Map(
			byCase(decisions.filter((decision) => decision.contender === contender)).map(
				({ case: id, expect, probabilities }) => [
					id,
					toVerdict(mean(probabilities)!, threshold) === expect
				]
			)
		);
	const a = consensus(first);
	const b = consensus(second);
	const shared = [...a.keys()].filter((id) => b.has(id));
	const count = (left: boolean, right: boolean): string[] =>
		shared.filter((id) => a.get(id) === left && b.get(id) === right);
	const onlyFirst = count(true, false);
	const onlySecond = count(false, true);
	return {
		first,
		second,
		cases: shared.length,
		both: count(true, true).length,
		neither: count(false, false),
		onlyFirst,
		onlySecond,
		pValue: signTest(onlyFirst.length, onlySecond.length)
	};
};
export type Comparison = ReturnType<typeof compare>;

/** The whole of `results.json`: each contender overall and by tier, category and Test, its sweep, and the paired comparison of the first two. */
export const analyze = (decisions: Decision[], contenders: Contender[], threshold: number) => {
	const slices = (own: Decision[], key: 'tier' | 'category' | 'test', price: Price) =>
		Object.fromEntries(
			[...new Set(own.map((decision) => decision[key]))].sort().map((value) => [
				value,
				summarize(
					own.filter((decision) => decision[key] === value),
					threshold,
					price
				)
			])
		);
	const [first, second] = contenders;
	return {
		threshold,
		contenders: contenders.map(({ id, label, price }) => {
			const own = decisions.filter((decision) => decision.contender === id);
			return {
				id,
				label,
				overall: summarize(own, threshold, price),
				byTier: slices(own, 'tier', price),
				byCategory: slices(own, 'category', price),
				byTest: slices(own, 'test', price),
				sweep: sweep(own)
			};
		}),
		comparison: first && second ? compare(decisions, first.id, second.id, threshold) : undefined
	};
};
export type Analysis = ReturnType<typeof analyze>;

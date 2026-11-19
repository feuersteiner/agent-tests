import type { Analysis, Summary } from './metrics.ts';
import type { RunInfo } from './types.ts';

const percent = (value?: number): string =>
	value === undefined ? 'n/a' : `${(value * 100).toFixed(1)}%`;

const number = (value: number | undefined, digits = 0, unit = ''): string =>
	value === undefined ? 'n/a' : `${value.toFixed(digits)}${unit}`;

const table = (head: string[], rows: string[][]): string =>
	[
		`| ${head.join(' | ')} |`,
		`| ${head.map(() => '---').join(' | ')} |`,
		...rows.map((row) => `| ${row.join(' | ')} |`)
	].join('\n');

const withInterval = ({ accuracy, accuracyInterval }: Summary): string =>
	accuracyInterval
		? `${percent(accuracy)} (${percent(accuracyInterval[0])} to ${percent(accuracyInterval[1])})`
		: percent(accuracy);

/** One table with a row per slice and, for each contender, its accuracy, false blocks and missed violations. */
const sliceTable = (analysis: Analysis, key: 'byTier' | 'byCategory' | 'byTest', name: string) => {
	const slices = [...new Set(analysis.contenders.flatMap((entry) => Object.keys(entry[key])))];
	return table(
		[name, 'Cases', ...analysis.contenders.map((entry) => entry.label)],
		slices.sort().map((slice) => [
			slice,
			String(analysis.contenders[0]?.[key][slice]?.cases ?? 0),
			...analysis.contenders.map((entry) => {
				const summary = entry[key][slice];
				return summary
					? `${percent(summary.accuracy)} · ${percent(summary.falseBlockRate)} · ${percent(summary.missedRate)}`
					: 'n/a';
			})
		])
	);
};

/** `RESULTS.md`: every table of a run, written from `results.json` and `run.json` alone. */
export const toMarkdown = (analysis: Analysis, info: RunInfo): string => {
	const { contenders, comparison } = analysis;
	const label = (id: string): string => contenders.find((entry) => entry.id === id)?.label ?? id;
	const row = (name: string, cell: (summary: Summary) => string): string[] => [
		name,
		...contenders.map((entry) => cell(entry.overall))
	];
	const sections = [
		'# Decision model benchmark',
		info.dryRun
			? '> **Dry run.** A fake model produced every number below to test the pipeline. They say nothing about any real model.'
			: '',
		[
			`Run ${info.startedAt} to ${info.finishedAt}.`,
			`${info.cases} cases, ${info.repeats} repeat(s) each, ${info.concurrency} at a time, threshold ${info.threshold}.`,
			`Dataset \`${info.datasetHash}\`, prompt \`${info.promptHash}\`, commit \`${info.commit}\`, ${info.runtime}.`
		].join(' '),
		table(
			['Contender', 'API', 'Model', 'Price in / out per million tokens'],
			info.contenders.map(({ label: name, api, model, price }) => [
				name,
				api,
				`\`${model}\``,
				price.inputPerMillion === null || price.outputPerMillion === null
					? 'not set'
					: `${price.inputPerMillion} / ${price.outputPerMillion} ${price.currency}, as of ${price.asOf ?? 'unknown'}`
			])
		),
		'## Overall',
		table(
			['Metric', ...contenders.map((entry) => entry.label)],
			[
				row('Accuracy (95% interval)', withInterval),
				row('False blocks', (summary) => percent(summary.falseBlockRate)),
				row('Missed violations', (summary) => percent(summary.missedRate)),
				row('Flip rate', (summary) => percent(summary.flipRate)),
				row('Brier score', (summary) => number(summary.brier, 3)),
				row('Latency, median', (summary) => number(summary.latencyP50, 0, ' ms')),
				row('Latency, 95th percentile', (summary) => number(summary.latencyP95, 0, ' ms')),
				[
					'Full pass, median',
					...contenders.map(({ id }) => {
						const passes = [...(info.passMs[id] ?? [])].sort((a, b) => a - b);
						return number(passes[Math.floor((passes.length - 1) / 2)], 0, ' ms');
					})
				],
				row('Tokens in / out per decision', (summary) =>
					summary.inputTokens === undefined
						? 'not reported'
						: `${number(summary.inputTokens)} / ${number(summary.outputTokens)}`
				),
				row('Cost per 1,000 decisions', (summary) => number(summary.costPer1000, 2)),
				row('Errors', (summary) => `${summary.errors} of ${summary.decisions}`)
			]
		),
		comparison
			? [
					'## Head to head',
					`Each model is taken at its mean probability over the repeats, on the ${comparison.cases} cases both answered.`,
					table(
						['Outcome', 'Cases'],
						[
							['Both right', String(comparison.both)],
							[`Only ${label(comparison.first)} right`, String(comparison.onlyFirst.length)],
							[`Only ${label(comparison.second)} right`, String(comparison.onlySecond.length)],
							['Both wrong', String(comparison.neither.length)]
						]
					),
					`Sign test on the cases that split them: p = ${comparison.pValue.toFixed(3)}. Above 0.05, the difference in accuracy is within what chance alone gives on this many cases.`,
					...(
						[
							[`Only ${label(comparison.first)} right`, comparison.onlyFirst],
							[`Only ${label(comparison.second)} right`, comparison.onlySecond],
							['Both wrong', comparison.neither]
						] as const
					).map(([title, ids]) =>
						ids.length ? `### ${title}\n\n${ids.map((id) => `- \`${id}\``).join('\n')}` : ''
					)
				].join('\n\n')
			: '',
		'## By slice',
		'Each cell: accuracy · false blocks · missed violations.',
		sliceTable(analysis, 'byTier', 'Tier'),
		sliceTable(analysis, 'byCategory', 'Category'),
		sliceTable(analysis, 'byTest', 'Test'),
		'## Threshold sweep',
		`Accuracy at each cut-off, from the stored probabilities. The run used ${info.threshold}. A better cut-off found here was chosen on these same cases, so treat it as a lead, not a result.`,
		table(
			['Threshold', ...contenders.map((entry) => entry.label)],
			(contenders[0]?.sweep ?? []).map(({ threshold }, index) => [
				threshold.toFixed(2),
				...contenders.map((entry) => percent(entry.sweep[index]?.accuracy))
			])
		)
	];
	return `${sections.filter(Boolean).join('\n\n')}\n`;
};

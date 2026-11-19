import { appendFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { hashDataset, loadContenders, loadDataset } from '../src/dataset.ts';
import { createDecider, createFakeDecider } from '../src/deciders.ts';
import { DECISIONS_FILE, RUN_FILE, currentCommit, hashPrompt, writeReport } from '../src/files.ts';
import { run } from '../src/run.ts';
import { installTap } from '../src/tap.ts';
import type { RunInfo } from '../src/types.ts';

/**
 * Runs the benchmark from the `benchmarks/` folder and writes one run folder under `results/`.
 * `--dry-run` swaps every model for a fake one and writes to `results/dry-run/`, which Git ignores.
 */
const { values } = parseArgs({
	options: {
		'dry-run': { type: 'boolean', default: false },
		repeats: { type: 'string', default: '5' },
		concurrency: { type: 'string', default: '4' },
		contender: { type: 'string', multiple: true },
		test: { type: 'string' },
		name: { type: 'string' }
	}
});
const dryRun = values['dry-run'];
const repeats = Number(values.repeats);
const concurrency = Number(values.concurrency);
const { threshold, contenders: all } = loadContenders();
const chosen = all.filter(({ id }) => !values.contender || values.contender.includes(id));
const dataset = await loadDataset();
const cases = dataset.cases.filter(({ test }) => !values.test || test.startsWith(values.test));
const startedAt = new Date().toISOString();
const folder = join('results', dryRun ? 'dry-run' : (values.name ?? startedAt.slice(0, 10)));

const stop = (message: string): never => {
	console.error(`Error: ${message}`);
	process.exit(2);
};
if (dataset.problems.length) stop(`the dataset has problems; run \`bun run dataset\``);
if (!Number.isInteger(repeats) || repeats < 1) stop('--repeats must be a whole number, 1 or more');
if (!Number.isInteger(concurrency) || concurrency < 1) stop('--concurrency must be 1 or more');
if (!chosen.length || !cases.length) stop('no contender or no case matches');
if (!dryRun && existsSync(folder)) stop(`${folder} exists; pass --name or remove it`);

installTap();
const entries = chosen.map((contender) => ({
	contender,
	decide: dryRun ? createFakeDecider(contender) : createDecider(contender, process.env)
}));
rmSync(folder, { recursive: true, force: true });
mkdirSync(folder, { recursive: true });
const total = cases.length * repeats * entries.length;
let done = 0;
const passMs = await run({
	cases,
	contenders: entries,
	repeats,
	concurrency,
	onDecision: (decision) => {
		appendFileSync(join(folder, DECISIONS_FILE), `${JSON.stringify(decision)}\n`);
		done += 1;
		if (done % 50 === 0 || done === total) console.log(`${done} of ${total} decision(s)`);
	}
});
const info: RunInfo = {
	dryRun,
	startedAt,
	finishedAt: new Date().toISOString(),
	repeats,
	concurrency,
	threshold,
	commit: currentCommit(),
	datasetHash: hashDataset(cases),
	promptHash: hashPrompt(),
	runtime: `Bun ${Bun.version}`,
	cases: cases.length,
	contenders: chosen.map(({ decision, ...rest }) => ({
		...rest,
		model: decision.model,
		api: decision.api,
		url: decision.url
	})),
	passMs
};
writeFileSync(join(folder, RUN_FILE), `${JSON.stringify(info, null, '\t')}\n`);
writeReport(folder, chosen);
console.log(`Wrote ${folder}/`);

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { analyze } from './metrics.ts';
import { toMarkdown } from './report.ts';
import type { Contender, Decision, RunInfo } from './types.ts';

/** The files of one run's folder. */
export const RUN_FILE = 'run.json';
export const DECISIONS_FILE = 'decisions.jsonl';
export const RESULTS_FILE = 'results.json';
export const REPORT_FILE = 'RESULTS.md';

/** The commit the working tree is at, with `+changes` when it differs from it. */
export const currentCommit = (): string => {
	const git = (...args: string[]): string => execFileSync('git', args, { encoding: 'utf8' }).trim();
	return `${git('rev-parse', '--short', 'HEAD')}${git('status', '--porcelain', '--', '.', '../core') ? '+changes' : ''}`;
};

/** A hash of the file that holds the decide engine's prompt, so a result names the prompt it was run with. */
export const hashPrompt = (): string =>
	createHash('sha256')
		.update(readFileSync('../core/src/engines/utils.ts'))
		.digest('hex')
		.slice(0, 16);

/** Reads a run folder's decisions and info, then writes its `results.json` and `RESULTS.md`. */
export const writeReport = (folder: string, contenders: Contender[]): void => {
	const info = JSON.parse(readFileSync(join(folder, RUN_FILE), 'utf8')) as RunInfo;
	const decisions = readFileSync(join(folder, DECISIONS_FILE), 'utf8')
		.split('\n')
		.filter(Boolean)
		.map((line) => JSON.parse(line) as Decision);
	const known = contenders.filter(({ id }) => info.contenders.some((entry) => entry.id === id));
	const analysis = analyze(decisions, known, info.threshold);
	writeFileSync(join(folder, RESULTS_FILE), `${JSON.stringify(analysis, null, '\t')}\n`);
	writeFileSync(join(folder, REPORT_FILE), toMarkdown(analysis, info));
};

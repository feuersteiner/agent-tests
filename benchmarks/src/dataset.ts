import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, posix, sep } from 'node:path';
import { parse } from 'yaml';
import {
	EVAL_FILE,
	createEngines,
	loadDefinitions,
	loadEvalDefinitions
} from '../../core/index.ts';
import type { AgentTestDefinition } from '../../core/types.ts';
import { BenchmarkMetaSchema, ContendersSchema } from './types.ts';
import type { BenchmarkMeta, Case, Contenders } from './types.ts';

/** The file next to `test.yaml` that records where a Test's cases come from. */
export const META_FILE = 'benchmark.yaml';

/** The fewest cases of each label a Test needs, so no Test is answered by always saying one thing. */
const MIN_PER_LABEL = 2;

/** The glob engine alone; the model engines are never called, so the key is a placeholder. */
const { glob } = createEngines(
	{
		decision: {
			api: 'openai',
			url: 'https://unused.invalid',
			model: 'unused',
			apiKeyEnv: 'UNUSED'
		},
		reasoning: {
			api: 'openai',
			url: 'https://unused.invalid',
			model: 'unused',
			apiKeyEnv: 'UNUSED'
		}
	},
	{ UNUSED: 'unused' }
);

/** `contenders.yaml` of the working directory, validated. */
export const loadContenders = (path = 'contenders.yaml'): Contenders =>
	ContendersSchema.parse(parse(readFileSync(path, 'utf8')));

/** Every file under `root` but its `eval.yaml`, as posix paths sorted by name. */
const listFiles = (root: string): string[] =>
	readdirSync(root, { recursive: true, encoding: 'utf8' })
		.filter((path) => statSync(join(root, path)).isFile())
		.map((path) => path.split(sep).join(posix.sep))
		.filter((path) => path !== EVAL_FILE)
		.sort();

/** The Test's `benchmark.yaml`, or the problem that stops it from loading. */
const loadMeta = (test: string): BenchmarkMeta | string => {
	const path = join('.agents/tests', test, META_FILE);
	if (!existsSync(path)) return `Missing ${META_FILE}`;
	const result = BenchmarkMetaSchema.safeParse(parse(readFileSync(path, 'utf8')));
	return result.success ? result.data : `${META_FILE}: ${result.error.issues[0]?.message}`;
};

/** The one criterion a benchmark Test asks, or the problem with its shape. */
const toCriterion = ({ select, assert }: AgentTestDefinition): string | { problem: string } => {
	if (
		!select ||
		select.glob === undefined ||
		select.grep !== undefined ||
		select.decide !== undefined
	)
		return { problem: 'select must be a glob alone' };
	if (assert.length !== 1) return { problem: 'assert must hold exactly one assertion' };
	const { grep, decide, reason } = assert[0]!;
	if (grep !== undefined || reason !== undefined || typeof decide !== 'string')
		return { problem: 'the assertion must be one decide criterion alone' };
	return decide;
};

/**
 * The dataset of the working directory's `.agents/tests/`, and every way it breaks the benchmark's
 * shape: one Test is one decide criterion, one eval is one file that the Test's glob selects, and
 * its label is pass or fail. Calls no model.
 */
export const loadDataset = async (): Promise<{ cases: Case[]; problems: string[] }> => {
	const cases: Case[] = [];
	const problems: string[] = [];
	for (const test of loadDefinitions()) {
		const report = (problem: string): number => problems.push(`${test.id}: ${problem}`);
		const meta = loadMeta(test.id);
		const criterion = toCriterion(test);
		if (typeof meta === 'string') report(meta);
		if (typeof criterion !== 'string') report(criterion.problem);
		if (typeof meta === 'string' || typeof criterion !== 'string') continue;
		if (test.id.startsWith('hand-') !== (meta.tier === 'hand'))
			report('only the ids of the hand tier start with hand-');
		const seen = new Map<string, string>();
		const labels = { pass: 0, fail: 0 };
		for (const { id, root, expect } of loadEvalDefinitions(test.id)) {
			const files = listFiles(root);
			const [path] = files;
			if (expect === 'skip') report(`${id}: expect must be pass or fail`);
			else if (files.length !== 1 || !path) report(`${id}: must hold exactly one file`);
			else if ((await glob(path, test.select!.glob!)) !== 1)
				report(`${id}: ${path} is not selected by the glob`);
			else {
				const content = readFileSync(join(root, path), 'utf8');
				const twin = seen.get(content);
				if (twin) report(`${id}: same content as ${twin}`);
				seen.set(content, id);
				labels[expect] += 1;
				cases.push({
					id: `${test.id}/${id}`,
					test: test.id,
					eval: id,
					tier: meta.tier,
					category: meta.category,
					criterion,
					path,
					content,
					expect
				});
			}
		}
		if (labels.pass < MIN_PER_LABEL || labels.fail < MIN_PER_LABEL)
			report(`needs at least ${MIN_PER_LABEL} pass and ${MIN_PER_LABEL} fail cases`);
	}
	return { cases, problems };
};

/** A hash of every criterion, path, content and label, so a result names the dataset it was run on. */
export const hashDataset = (cases: Case[]): string => {
	const hash = createHash('sha256');
	for (const { id, criterion, path, content, expect } of cases)
		hash.update(JSON.stringify([id, criterion, path, content, expect]));
	return hash.digest('hex').slice(0, 16);
};

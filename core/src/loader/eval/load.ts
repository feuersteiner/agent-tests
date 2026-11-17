import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { AgentTestEvalDefinition } from '../../eval/types.ts';
import type { AgentTestEvalFile } from '../types.ts';
import { readFile } from '../helpers/file.ts';
import { parseEval } from './parse.ts';

/** The file in each eval folder that holds its expected outcome; never one of its sources. */
export const EVAL_FILE = 'eval.yaml';

/** Load every immediate `evals/` folder of the Test folder named `id`, sorted by folder name; none when it has no `evals/` folder. */
export const loadEvalFiles = (id: string): AgentTestEvalFile[] => {
	const directory = join('.agents/tests', id, 'evals');
	if (!existsSync(directory)) return [];
	return readdirSync(directory, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort()
		.map((name) => {
			const root = join(directory, name);
			const path = join(root, EVAL_FILE);
			try {
				const { expect } = parseEval(readFile(path, `Missing ${EVAL_FILE}`));
				return { path, eval: { id: name, root, expect } };
			} catch (error) {
				return { path, error: error instanceof Error ? error.message : String(error) };
			}
		});
};

/** The evals in the files `loadEvalFiles` loads, in its order (by folder name), or one error listing every invalid file. */
export const loadEvalDefinitions = (id: string): AgentTestEvalDefinition[] => {
	const files = loadEvalFiles(id);
	const invalid = files.filter((file) => file.error);
	if (invalid.length)
		throw new Error(
			[
				`${invalid.length} of ${files.length} eval(s) invalid:`,
				...invalid.map(({ path, error }) => `${path}\n  ${error!.replaceAll('\n', '\n  ')}`)
			].join('\n')
		);
	return files.map((file) => file.eval!);
};

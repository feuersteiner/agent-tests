import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { AgentTestDefinition, AgentTestFile } from '../types.ts';
import { readFile } from '../helpers/file.ts';
import { parseTest } from './parse.ts';

/** Load every immediate `.agents/tests/` folder, sorted by folder name, or only the one named `id`. */
export const loadTestFiles = (id?: string): AgentTestFile[] => {
	const directory = '.agents/tests';
	if (!existsSync(directory)) throw new Error(`No ${directory}/ folder in the current directory`);
	const folders = readdirSync(directory, { withFileTypes: true })
		.filter((entry) => entry.isDirectory() && (!id || entry.name === id))
		.map((entry) => entry.name)
		.sort();
	if (id && !folders.length) throw new Error(`Unknown test: ${id}`);
	if (!folders.length) throw new Error(`No tests found in ${directory}/`);
	return folders.map((folder) => {
		const path = join(directory, folder, 'test.yaml');
		try {
			const test = parseTest(
				readFile(path, `Missing test.yaml; run \`agent-tests compile ${folder}\``)
			);
			if (test.id !== folder) return { path, error: `id: Must match the folder name "${folder}"` };
			return { path, test };
		} catch (error) {
			return { path, error: error instanceof Error ? error.message : String(error) };
		}
	});
};

/** The definitions in the files `loadTestFiles` loads, in its order (by folder name), or one error listing every invalid file. */
export const loadDefinitions = (id?: string): AgentTestDefinition[] => {
	const files = loadTestFiles(id);
	const invalid = files.filter((file) => file.error);
	if (invalid.length)
		throw new Error(
			[
				`${invalid.length} of ${files.length} test(s) invalid:`,
				...invalid.map(({ path, error }) => `${path}\n  ${error!.replaceAll('\n', '\n  ')}`)
			].join('\n')
		);
	return files.map((file) => file.test!);
};

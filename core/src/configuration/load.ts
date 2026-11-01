import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse } from 'dotenv';
import { parseConfiguration } from './parse.js';
import type { LoadedConfiguration } from './types.js';

const readOptional = async (path: string): Promise<string | undefined> => {
	try {
		return await readFile(path, 'utf8');
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
		throw new Error('Cannot read local agent-tests configuration', { cause: error });
	}
};

/** Read optional YAML and .env; environment values win and process.env is never mutated. */
export const loadConfiguration = async (
	root: string,
	environment: NodeJS.ProcessEnv = process.env
): Promise<LoadedConfiguration> => {
	const directory = resolve(root);
	const [yaml, dotenv] = await Promise.all([
		readOptional(resolve(directory, 'agent-tests.config.yaml')),
		readOptional(resolve(directory, '.env'))
	]);
	const supplied = Object.fromEntries(
		Object.entries(environment).filter((entry): entry is [string, string] => entry[1] !== undefined)
	);
	return {
		root: directory,
		config: yaml === undefined ? {} : parseConfiguration(yaml),
		environment: { ...(dotenv === undefined ? {} : parse(dotenv)), ...supplied }
	};
};

import { resolve } from 'node:path';
import { assembleConfiguration } from './assemble-configuration.js';
import { collectEnvironment } from './collect-environment.js';
import { readConfigurationFiles } from './read-configuration-files.js';
import type { LoadedConfiguration } from '../types.js';

/** Read optional YAML and .env; supplied environment wins without writes or process.env mutation. */
export const loadConfiguration = async (
	root: string,
	environment: NodeJS.ProcessEnv = process.env
): Promise<LoadedConfiguration> => {
	const directory = resolve(root);
	const files = await readConfigurationFiles(directory);
	const supplied = collectEnvironment(environment);
	return assembleConfiguration(directory, files, supplied);
};

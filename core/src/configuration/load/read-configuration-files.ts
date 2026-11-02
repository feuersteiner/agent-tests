import { resolve } from 'node:path';
import { readOptional } from './utils.js';
import type { ConfigurationFiles } from './types.js';

/** Read optional YAML and dotenv files concurrently; propagate non-missing read failures. */
export const readConfigurationFiles = async (directory: string): Promise<ConfigurationFiles> => {
	const [yaml, dotenv] = await Promise.all([
		readOptional(resolve(directory, 'agent-tests.config.yaml')),
		readOptional(resolve(directory, '.env'))
	]);
	return { yaml, dotenv };
};

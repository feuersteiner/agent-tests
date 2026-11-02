import { parse } from 'dotenv';
import { parseConfiguration } from '../parse.js';
import type { LoadedConfiguration } from '../types.js';
import type { ConfigurationFiles } from './types.js';

/** Parse optional configuration and merge dotenv below supplied values; propagate invalid YAML. */
export const assembleConfiguration = (
	root: string,
	files: ConfigurationFiles,
	supplied: Record<string, string>
): LoadedConfiguration => ({
	root,
	config: files.yaml === undefined ? {} : parseConfiguration(files.yaml),
	environment: { ...(files.dotenv === undefined ? {} : parse(files.dotenv)), ...supplied }
});

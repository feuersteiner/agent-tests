import type { AgentTestConfig } from '../types.ts';
import { readFile } from '../helpers/file.ts';
import { parseConfig } from './parse.ts';

/** The repository config file, relative to the current working directory. */
export const CONFIG_PATH = 'agent-tests.config.yaml';

/** Read the config file and parse it. */
export const loadConfig = (): AgentTestConfig =>
	parseConfig(readFile(CONFIG_PATH, `Missing ${CONFIG_PATH}; run \`agent-tests init\``));

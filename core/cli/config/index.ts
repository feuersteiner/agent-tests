import { AgentTests } from '../../src/index.ts';
import { loadConfig } from '../../src/config/index.ts';
import { loadDefinitions } from './definitions.ts';
import { loadSources } from '../sources/index.ts';

/** Load config first, then definitions and sources, and construct the runner. */
export const loadRunner = (id?: string): AgentTests => {
	const config = loadConfig();
	const directory = '.agents/tests';
	const definitions = loadDefinitions(directory);
	const selected = id ? definitions.filter((definition) => definition.id === id) : definitions;
	if (id && !selected.length) throw new Error(`Unknown test: ${id}`);
	if (!selected.length) throw new Error(`No agent tests found in ${directory}`);
	return new AgentTests(loadSources(), selected, config);
};

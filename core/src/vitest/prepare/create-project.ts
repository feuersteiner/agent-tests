import { existsSync } from 'node:fs';
import { mkdtemp, realpath, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectHostedGroups } from '../collect.js';
import { selectHostedScope } from '../select-scope.js';
import type { AgentTestsOptions, HostedProject, PluginState } from '../types.js';

/** Write a canonical temporary entry and collect initial targets; retain its path for failed-setup cleanup. */
export const createProject = async (
	options: AgentTestsOptions,
	defaultRoot: string,
	state: PluginState
): Promise<HostedProject> => {
	const root = resolve(options.root ?? defaultRoot);
	const scope = selectHostedScope(options);
	state.temporary = await mkdtemp(join(tmpdir(), 'agent-tests-vitest-'));
	const directory = await realpath(state.temporary);
	const cacheDirectory = join(directory, 'answers');
	let runner = fileURLToPath(new URL('../runner.js', import.meta.url));
	if (!existsSync(runner)) runner = runner.replace(/\.js$/, '.ts');
	const project: HostedProject = {
		directory,
		entry: join(directory, 'agent-tests.test.mjs'),
		source: `import { registerHostedTests } from ${JSON.stringify(runner)};\nregisterHostedTests();\n`,
		provided: {
			root,
			scope,
			cacheDirectory,
			groups: await collectHostedGroups(root, scope, cacheDirectory)
		}
	};
	await writeFile(project.entry, project.source);
	return project;
};

import { existsSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vitest/config';
import { collectHostedGroups, selectHostedScope } from './collect.js';
import type { AgentTestsOptions, HostedContext } from './types.js';

/** Add installed agent tests as an independent Vitest 5 project; live processes are not retained. */
export const agentTests = (options: AgentTestsOptions = {}): Plugin => {
	let temporary: string | undefined;
	let stopWatching: (() => void) | undefined;
	return {
		name: 'agent-tests',
		configureVitest: async (context) => {
			const root = resolve(options.root ?? context.project.config.root);
			const scope = selectHostedScope(options);
			temporary = await mkdtemp(join(tmpdir(), 'agent-tests-vitest-'));
			const directory = temporary;
			const cacheDirectory = join(directory, 'answers');
			const entry = join(directory, 'agent-tests.test.mjs');
			let runner = fileURLToPath(new URL('./runner.js', import.meta.url));
			if (!existsSync(runner)) runner = runner.replace(/\.js$/, '.ts');
			const source = `import { registerHostedTests } from ${JSON.stringify(runner)};\nregisterHostedTests();\n`;
			const provided: HostedContext = {
				root,
				scope,
				cacheDirectory,
				groups: await collectHostedGroups(root, scope, cacheDirectory)
			};
			await writeFile(entry, source);
			const projects = await context.injectTestProjects({
				extends: false,
				root: directory,
				cacheDir: join(directory, 'vite-cache'),
				test: {
					name: 'agent-tests',
					include: ['agent-tests.test.mjs'],
					environment: 'node',
					provide: { agentTests: provided }
				}
			});
			if (!context.vitest.config.watch) return;
			let refresh = Promise.resolve();
			const changed = (path: string): void => {
				const local = relative(root, path);
				if (local.startsWith('..') || /(^|[/\\])(node_modules|\.git)([/\\]|$)/.test(local)) return;
				refresh = refresh
					.then(async () => {
						const groups = await collectHostedGroups(root, scope, cacheDirectory);
						const configurationChanged = /(^|[/\\])(agent-tests\.config\.yaml|\.env)$/.test(local);
						if (
							!provided.error &&
							!configurationChanged &&
							JSON.stringify(groups) === JSON.stringify(provided.groups)
						)
							return;
						delete provided.error;
						provided.groups = groups;
						for (const project of projects) project.provide('agentTests', provided);
						await writeFile(entry, `${source}// ${Date.now()}\n`);
					})
					.catch(async () => {
						if (provided.error) return;
						provided.error = 'Unable to refresh agent test targets';
						for (const project of projects) project.provide('agentTests', provided);
						await writeFile(entry, `${source}// failed ${Date.now()}\n`);
					});
			};
			context.vitest.vite.watcher.add([root, entry]);
			context.vitest.vite.watcher.on('change', changed).on('add', changed).on('unlink', changed);
			stopWatching = () => {
				for (const event of ['change', 'add', 'unlink'])
					context.vitest.vite.watcher.off(event, changed);
			};
		},
		closeBundle: async () => {
			stopWatching?.();
			if (temporary) await rm(temporary, { recursive: true, force: true });
		}
	};
};

export default agentTests;
export type { AgentTestsOptions } from './types.js';

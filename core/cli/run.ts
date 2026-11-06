import { AgentTest } from '../src/index.ts';
import { Source } from '../src/shared/source.ts';
import type { ResultEntry } from '../src/shared/types.ts';
import type { Command } from './args.ts';
import { loadConfig } from './config.ts';
import { discover } from './discover.ts';
import { loadSources } from './files.ts';
import { baseCommit } from './git.ts';
import { printReport } from './report.ts';
import type { TestReport } from './report.ts';

const serialize = <T>({ source, ...entry }: ResultEntry<T>) => ({ path: source.path, ...entry });

export const execute = async (root: string, command: Command): Promise<number> => {
	const installed = await discover(root, command.name === 'run' ? undefined : command.args[0]);
	let config: ReturnType<typeof loadConfig> | undefined;
	try {
		config = loadConfig(
			root,
			command.options.base ? baseCommit(root, command.options.base) : undefined
		);
	} catch {
		/* Report the failure for every discovered test. */
	}
	if (!installed.length && !config) throw new Error('Missing or invalid configuration');
	const sources =
		command.name === 'run' && config ? await loadSources(root, command.options, command.args) : [];
	const results: TestReport[] = [];
	for (const item of installed) {
		const result: TestReport = { id: item.id, owner: item.owner, exitCode: 0 };
		try {
			if (!config) throw new Error('Invalid configuration');
			if (item.error || !item.test) {
				result.error = item.error;
				throw new Error('Invalid definition');
			}
			const local = sources
				.filter((source) => !item.owner || source.path.startsWith(`${item.owner}/`))
				.map(
					(source) =>
						new Source(
							item.owner ? source.path.slice(item.owner.length + 1) : source.path,
							source.open
						)
				);
			const test = new AgentTest(local, item.test, config);
			if (command.name !== 'validate') {
				const entries =
					command.name === 'eval'
						? await test.eval(command.options.verbose)
						: (await test.run(command.options.verbose)).check;
				result.flagged = entries.flagged.map(serialize);
				result.cleared = entries.cleared.map(serialize);
				result.exitCode = entries.flagged.length ? 1 : 0;
			}
		} catch {
			result.exitCode = 2;
			result.error ??= config
				? 'Test execution failed; check model configuration and environment keys'
				: 'Missing or invalid agent-tests.config.yaml or .env';
		}
		results.push(result);
	}
	return printReport(results, command.options.json);
};

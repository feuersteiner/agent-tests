import { command, type Command, type Handler } from 'clinguini';
import { AgentTests } from '../../src/index.ts';
import type { AgentTestResult } from '../../src/assert/types.ts';
import { loadConfig } from '../../src/loader/index.ts';
import type { AgentTestScope } from '../../src/scope/types.ts';
import { message } from '../helpers/error.ts';

type Flags = Parameters<Handler>[0]['flags'];

/** The scope the flags name: all sources without one; more than one is an error. */
const toScope = ({ changed, staged, base }: Flags): AgentTestScope => {
	const given = [changed === true, staged === true, typeof base === 'string'].filter(Boolean);
	if (given.length > 1) throw new Error('Use only one of --changed, --staged, and --base');
	if (changed === true) return { kind: 'changed' };
	if (staged === true) return { kind: 'staged' };
	if (typeof base === 'string') return { kind: 'base', ref: base };
	return { kind: 'all' };
};

/** One `<path>  <test>/<assertion>  <error>` line per finding, in result order. */
const toLines = (results: AgentTestResult[]): string[] =>
	results.flatMap(({ test, findings }) =>
		findings.map(
			({ source, assertion }) => `${source.path}  ${test.id}/${assertion.id}  ${assertion.error}`
		)
	);

export const runCommand: Command = command({
	name: 'run',
	description: 'Run repository tests.',
	params: [{ name: 'id', optional: true, description: 'Exact test ID; omit for all.' }],
	flags: [
		{ name: 'changed', type: 'boolean', description: 'Select uncommitted files.' },
		{ name: 'staged', type: 'boolean', description: 'Select staged files.' },
		{ name: 'base', type: 'string', description: 'Select changes against a base ref.' }
	],
	handler: async ({ params, flags }): Promise<void> => {
		try {
			const scope = toScope(flags);
			const results = await new AgentTests(loadConfig()).run(scope, params.id);
			const lines = toLines(results);
			for (const line of lines) console.log(line);
			process.exitCode = lines.length ? 1 : 0;
		} catch (error) {
			console.error(`Error: ${message(error)}`);
			process.exitCode = 2;
		}
	}
});

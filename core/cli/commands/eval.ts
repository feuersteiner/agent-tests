import { command, type Command } from 'clinguini';
import { AgentTests } from '../../src/index.ts';
import type { AgentTestEvalsResult } from '../../src/eval/types.ts';
import { loadConfig } from '../../src/loader/index.ts';
import { message } from '../helpers/error.ts';

/** One `<test>/<eval>  expected <expect>, got <actual>` line per eval that does not match, in result order. */
const toLines = (results: AgentTestEvalsResult[]): string[] =>
	results.flatMap(({ test, evals }) =>
		evals
			.filter(({ matches }) => !matches)
			.map(
				({ eval: { id, expect }, actual }) => `${test.id}/${id}  expected ${expect}, got ${actual}`
			)
	);

/** The `<matching> of <total> eval(s) match.` line, counted across every Test. */
const toCount = (results: AgentTestEvalsResult[]): string => {
	const evals = results.flatMap((result) => result.evals);
	const matching = evals.filter(({ matches }) => matches).length;
	return `${matching} of ${evals.length} eval(s) match.`;
};

export const evalCommand: Command = command({
	name: 'eval',
	description: 'Run labeled test examples.',
	params: [{ name: 'id', optional: true, description: 'Exact test ID; omit for all.' }],
	handler: async ({ params }): Promise<void> => {
		try {
			const results = await new AgentTests(loadConfig(), process.env).eval(params.id);
			const lines = toLines(results);
			for (const line of lines) console.log(line);
			console.log(toCount(results));
			process.exitCode = lines.length ? 1 : 0;
		} catch (error) {
			console.error(`Error: ${message(error)}`);
			process.exitCode = 2;
		}
	}
});

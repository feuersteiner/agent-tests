import { stringify } from 'yaml';
import type { AgentTest } from '../src/types.ts';

export interface FileChange {
	path: string;
	content: string | null;
}

export interface DemoStep {
	title: string;
	args: string[];
	exitCode: 0 | 1 | 2;
	output: string;
	change?: FileChange;
}

const commands: string[][] = [
	['--help'],
	['init'],
	['add', 'no-todo'],
	['list'],
	['validate'],
	['validate', 'no-todo'],
	['targets', 'no-todo'],
	['compile', 'no-todo'],
	['eval'],
	['eval', 'no-todo'],
	['run'],
	['run', 'no-todo'],
	['run', '--changed'],
	['run', '--staged'],
	['run', '--base', 'main'],
	['docs'],
	['vote', 'no-todo']
];
const outputs: Record<string, string> = {
	'--help': 'Usage: agent-tests',
	run: 'Run complete: 0 finding(s).',
	eval: '0 mismatch(es).',
	init: 'scaffold only.',
	add: 'scaffold only.',
	docs: 'scaffold only.',
	vote: 'scaffold only.'
};

/** Exercise commands, then inject violations from the labeled examples. */
export const createSteps = (definitions: AgentTest[]): DemoStep[] => {
	const steps: DemoStep[] = commands.map((args): DemoStep => ({
		title: 'Clean repository',
		args,
		exitCode: 0,
		output: outputs[args[0]!] ?? 'Loaded config'
	}));
	for (const content of [
		'// TODO: remove this temporary violation.\n',
		'// TODO: remove this temporary violation.\nconsole.log("temporary debug");\n'
	]) {
		steps.push({
			title: 'Inject a broken source file',
			args: ['run'],
			exitCode: 1,
			output: `Run complete: ${content.includes('console.log') ? 2 : 1} finding(s).`,
			change: { path: 'src/temporary-violation.ts', content }
		});
		steps.push({
			title: 'Injected source deleted',
			args: ['run'],
			exitCode: 0,
			output: 'Run complete: 0 finding(s).'
		});
	}
	for (const test of definitions) {
		if (test.id === 'component-structure') continue;
		for (const example of test.evals.filter((example) => example.expect === 'fail')) {
			steps.push({
				title: `${test.title}: ${example.name}`,
				args: ['run', test.id],
				exitCode: 1,
				output: 'Run complete: 1 finding(s).',
				change: { path: example.path, content: example.content }
			});
			steps.push({
				title: `${test.title}: restored`,
				args: ['run', test.id],
				exitCode: 0,
				output: 'Run complete: 0 finding(s).'
			});
		}
	}
	for (const change of [
		{ path: 'src/components/button-ui/types.ts', content: null },
		{ path: 'src/components/button-ui/extra.ts', content: 'export const extra = true;\n' },
		{ path: 'src/components/button-ui/nested/note.txt', content: 'Unexpected nested child.\n' },
		{ path: 'src/features/checkout/components/payment-ui/types.ts', content: null }
	] satisfies FileChange[]) {
		steps.push({
			title: `Broken folder: ${change.path}`,
			args: ['run', 'component-structure'],
			exitCode: 1,
			output: 'Run complete: 1 finding(s).',
			change
		});
		steps.push({
			title: 'Folder structure restored',
			args: ['run', 'component-structure'],
			exitCode: 0,
			output: 'Run complete: 0 finding(s).'
		});
	}
	const noTodo = definitions.find((test) => test.id === 'no-todo');
	if (!noTodo) throw new Error('Missing no-todo fixture definition');
	const wrongLabel: AgentTest = structuredClone(noTodo);
	wrongLabel.evals[0]!.expect = 'fail';
	steps.push(
		{
			title: 'Missing config',
			args: ['validate'],
			exitCode: 1,
			output: 'ENOENT',
			change: { path: 'agent-tests.config.yaml', content: null }
		},
		{
			title: 'Malformed YAML',
			args: ['validate'],
			exitCode: 1,
			output: 'Invalid YAML',
			change: { path: 'agent-tests.config.yaml', content: '{\n' }
		},
		{
			title: 'Invalid config',
			args: ['validate'],
			exitCode: 1,
			output: 'Invalid configuration',
			change: { path: 'agent-tests.config.yaml', content: '{}\n' }
		},
		{
			title: 'Invalid regex',
			args: ['validate'],
			exitCode: 1,
			output: 'Invalid regular expression',
			change: {
				path: '.agents/tests/no-todo/test.yaml',
				content: stringify({ ...noTodo, checks: [{ ...noTodo.checks[0], grep: '[' }] })
			}
		},
		{
			title: 'Unknown test ID',
			args: ['run', 'missing'],
			exitCode: 1,
			output: 'Unknown test: missing'
		},
		{
			title: 'Incorrect eval label',
			args: ['eval', 'no-todo'],
			exitCode: 1,
			output: '1 mismatch(es).',
			change: { path: '.agents/tests/no-todo/test.yaml', content: stringify(wrongLabel) }
		},
		{
			title: 'All restored definitions validate',
			args: ['validate'],
			exitCode: 0,
			output: 'are valid.'
		},
		{
			title: 'All restored examples match',
			args: ['eval'],
			exitCode: 0,
			output: '0 mismatch(es).'
		},
		{
			title: 'All restored sources pass',
			args: ['run'],
			exitCode: 0,
			output: 'Run complete: 0 finding(s).'
		}
	);
	return steps;
};

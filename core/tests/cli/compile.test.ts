import { describe, expect, test } from 'bun:test';
import {
	NEW_TEST_PROMPT,
	toCompilePrompt,
	toRulePrompt
} from '../../cli/commands/compile/prompts.ts';
import { toSteps } from '../../cli/commands/compile/sections.ts';
import { runCli } from '../helpers/cli.ts';
import { testFolder, validTest } from '../helpers/fixtures.ts';
import { inTempDir } from '../helpers/temp.ts';

const RULE = '# No TODO\n\nSource files under `src/` hold no TODO comments.\n\nExceptions: none.\n';

/** Keeps `.agents/tests/` present without any Test in it. */
const EMPTY_TESTS = { '.agents/tests/.keep': '' };

/** The numbered step lines of a prompt, in order. */
const toStepLines = (prompt: string): string[] =>
	prompt.split('\n').filter((line) => /^\d+\. /.test(line));

describe('compile command', () => {
	test('with a TEST.md, prints the compile prompt for that rule and exits 0', async () => {
		await inTempDir(testFolder(validTest(), {}, RULE), (dir) => {
			const result = runCli(['compile', 'no-todo'], { cwd: dir });
			expect(result.exitCode).toBe(0);
			expect(result.stdout).toBe(`${toCompilePrompt('no-todo', RULE)}\n`);
		});
	});

	test('the compile prompt holds the rule verbatim and names the id', async () => {
		await inTempDir(testFolder(validTest(), {}, RULE), (dir) => {
			const { stdout } = runCli(['compile', 'no-todo'], { cwd: dir });
			expect(stdout).toContain(RULE);
			expect(stdout).toContain('# Compile the agentests Test `no-todo`');
			expect(stdout).toContain('`.agents/tests/no-todo/test.yaml`');
		});
	});

	test('the compile prompt names the validate and eval commands with npx, never bunx or bun run', async () => {
		await inTempDir(testFolder(validTest(), {}, RULE), (dir) => {
			const { stdout } = runCli(['compile', 'no-todo'], { cwd: dir });
			expect(stdout).toContain('`npx agentests validate no-todo`');
			expect(stdout).toContain('`npx agentests eval no-todo`');
			expect(stdout).not.toContain('bunx');
			expect(stdout).not.toContain('bun run');
		});
	});

	test('a rule holding a code fence is quoted in a longer fence', async () => {
		const rule = '# No TODO\n\n```ts\n// TODO\n```\n';
		await inTempDir(testFolder(validTest(), {}, rule), (dir) => {
			const { stdout } = runCli(['compile', 'no-todo'], { cwd: dir });
			expect(stdout).toContain(`\`\`\`\`markdown\n${rule}\`\`\`\`\n`);
		});
	});

	test('the same input prints identical output twice', async () => {
		await inTempDir(testFolder(validTest(), {}, RULE), (dir) => {
			const first = runCli(['compile', 'no-todo'], { cwd: dir });
			const second = runCli(['compile', 'no-todo'], { cwd: dir });
			expect(second.stdout).toBe(first.stdout);
		});
	});

	test('without an id, prints the new-Test prompt and exits 0', async () => {
		await inTempDir(EMPTY_TESTS, (dir) => {
			const result = runCli(['compile'], { cwd: dir });
			expect(result.exitCode).toBe(0);
			expect(result.stdout).toBe(`${NEW_TEST_PROMPT}\n`);
		});
	});

	const missingRules: [string, Record<string, string>][] = [
		['no Test folder', EMPTY_TESTS],
		['a Test folder without TEST.md', testFolder(validTest())],
		['an empty TEST.md', testFolder(validTest(), {}, '')],
		['a blank TEST.md', testFolder(validTest(), {}, '  \n\t\n')]
	];

	test.each(missingRules)(
		'with %s, prints the write-the-rule prompt naming the id',
		async (_, files) => {
			await inTempDir(files, (dir) => {
				const result = runCli(['compile', 'no-todo'], { cwd: dir });
				expect(result.exitCode).toBe(0);
				expect(result.stdout).toBe(`${toRulePrompt('no-todo')}\n`);
				expect(result.stdout).toContain('`.agents/tests/no-todo/TEST.md`');
			});
		}
	);

	const invalidIds = ['No-Todo', 'no_todo', 'no--todo', 'no-todo-', 'no todo', '../x'];

	test.each(invalidIds)('an id that is not lowercase kebab-case (%p) exits 2', async (id) => {
		const files = { ...EMPTY_TESTS, '.agents/x/TEST.md': RULE };
		await inTempDir(files, (dir) => {
			const result = runCli(['compile', id], { cwd: dir });
			expect(result.exitCode).toBe(2);
			expect(result.stderr).toContain('Invalid test id');
			expect(result.stdout).not.toContain(RULE);
		});
	});

	const folderlessArgs: [string[]][] = [[[]], [['no-todo']]];

	test.each(folderlessArgs)('without a .agents/tests folder, exits 2 (args %p)', async (args) => {
		await inTempDir({ 'src/a.ts': '// TODO\n' }, (dir) => {
			const result = runCli(['compile', ...args], { cwd: dir });
			expect(result.exitCode).toBe(2);
			expect(result.stderr).toContain('No .agents/tests/ folder');
			expect(result.stdout.trim()).toBe('');
		});
	});

	test('needs no config file and no API keys', async () => {
		await inTempDir(testFolder(validTest(), {}, RULE), (dir) => {
			const result = runCli(['compile', 'no-todo'], { cwd: dir, env: {} });
			expect(result.exitCode).toBe(0);
			expect(result.stderr).toBe('');
			expect(result.stdout).toContain(RULE);
		});
	});
});

describe('compile prompts', () => {
	test('toSteps numbers the steps 1 to n in order', () => {
		expect(toSteps(['First.', 'Second.', 'Third.'])).toBe(
			'## Steps\n\n1. First.\n2. Second.\n3. Third.'
		);
	});

	test('toCompilePrompt quotes the rule verbatim, adding the final line break it lacks', () => {
		const prompt = toCompilePrompt('no-todo', '# No TODO\n\nNo TODO.');
		expect(prompt).toContain('```markdown\n# No TODO\n\nNo TODO.\n```');
		expect(toCompilePrompt('no-todo', RULE)).toContain(`\`\`\`markdown\n${RULE}\`\`\``);
	});

	const fences: [string, string, string][] = [
		['no backticks', 'No TODO.\n', '```'],
		['inline code', 'No `TODO`.\n', '```'],
		['a three-backtick fence', '```ts\n// TODO\n```\n', '````'],
		['a five-backtick fence', '`````\nx\n`````\n', '``````']
	];

	test.each(fences)(
		'toCompilePrompt quotes a rule with %s in a fence it cannot close',
		(_, rule, fence) => {
			expect(toCompilePrompt('no-todo', rule)).toContain(`\n${fence}markdown\n${rule}${fence}\n`);
		}
	);

	test('toCompilePrompt names the id and its validate and eval steps, numbered in order', () => {
		const prompt = toCompilePrompt('user-text-french', RULE);
		expect(prompt).toContain('# Compile the agentests Test `user-text-french`');
		const steps = toStepLines(prompt);
		expect(steps.map((line) => line.split('.')[0])).toEqual(['1', '2', '3', '4', '5', '6', '7']);
		expect(steps[4]).toContain('`npx agentests validate user-text-french`');
		expect(steps[5]).toContain('`npx agentests eval user-text-french`');
	});

	test('toRulePrompt names the id, its TEST.md, and the compile command for it', () => {
		const prompt = toRulePrompt('user-text-french');
		expect(prompt).toContain('# Write the rule of the agentests Test `user-text-french`');
		expect(prompt).toContain('`.agents/tests/user-text-french/TEST.md` is missing or blank');
		const steps = toStepLines(prompt);
		expect(steps.map((line) => line.split('.')[0])).toEqual(['1', '2', '3', '4', '5']);
		expect(steps[4]).toContain('`npx agentests compile user-text-french`');
	});

	test('NEW_TEST_PROMPT names a new Test with the <id> placeholder', () => {
		expect(NEW_TEST_PROMPT).toContain('# Write the rule of a new agentests Test');
		const steps = toStepLines(NEW_TEST_PROMPT);
		expect(steps.map((line) => line.split('.')[0])).toEqual(['1', '2', '3', '4', '5']);
		expect(steps[2]).toContain('Choose an id, `<id>` below');
		expect(steps[3]).toContain('`.agents/tests/<id>/TEST.md`');
		expect(steps[4]).toContain('`npx agentests compile <id>`');
	});

	const prompts: [string, string][] = [
		['toCompilePrompt', toCompilePrompt('no-todo', RULE)],
		['toRulePrompt', toRulePrompt('no-todo')],
		['NEW_TEST_PROMPT', NEW_TEST_PROMPT]
	];

	test.each(prompts)('%s says npx, never bunx or bun run', (_, prompt) => {
		expect(prompt).toContain('npx agentests');
		expect(prompt).not.toContain('bunx');
		expect(prompt).not.toContain('bun run');
	});
});

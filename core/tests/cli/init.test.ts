import { describe, expect, test } from 'bun:test';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { devNull } from 'node:os';
import { dirname, join } from 'node:path';
import { parseConfig } from '../../src/loader/index.ts';
import { toConfig } from '../../cli/commands/init/presets.ts';
import { runCli } from '../helpers/cli.ts';
import { toYaml } from '../helpers/fixtures.ts';
import { git, inTempRepo } from '../helpers/git.ts';
import { inTempDir, writeFiles } from '../helpers/temp.ts';

/** The command the written pre-commit hook runs. */
const HOOK_COMMAND = 'npx agentests run --staged';

/** The default hook path Git reports, relative to the repository root. */
const HOOK = '.git/hooks/pre-commit';

/** Keeps the child's Git away from the developer's global and system config, such as a global core.hooksPath. */
const GIT_ENV = { GIT_CONFIG_GLOBAL: devNull, GIT_CONFIG_NOSYSTEM: '1' };

/** Runs `agentests init` with `args` in `dir`. */
const init = (dir: string, args: string[] = [], env: Record<string, string> = {}) =>
	runCli(['init', ...args], { cwd: dir, env: { ...GIT_ENV, ...env } });

/** Whether the file at `path` is executable by its owner. */
const isExecutable = (path: string): boolean => (statSync(path).mode & 0o100) !== 0;

/** Every entry under `dir` with its content, mode, and modification time, to detect any change. */
const snapshot = (dir: string): Record<string, string> =>
	Object.fromEntries(
		readdirSync(dir, { recursive: true, encoding: 'utf8' })
			.sort()
			.map((path) => {
				const stats = statSync(join(dir, path));
				const content = stats.isFile() ? readFileSync(join(dir, path), 'utf8') : '<dir>';
				return [path, `${stats.mode} ${stats.mtimeMs} ${content}`];
			})
	);

describe('agentests init', () => {
	test('creates the config, the Tests folder, and an executable pre-commit hook running the staged check', async () => {
		await inTempRepo({}, (dir) => {
			const result = init(dir);
			expect(result.exitCode).toBe(0);
			expect(existsSync(join(dir, 'agentests.config.yaml'))).toBe(true);
			expect(statSync(join(dir, '.agents/tests')).isDirectory()).toBe(true);
			expect(isExecutable(join(dir, HOOK))).toBe(true);
			expect(readFileSync(join(dir, HOOK), 'utf8').split('\n')).toEqual([
				'#!/bin/sh',
				HOOK_COMMAND,
				''
			]);
			expect(result.lines).toEqual([
				'Created agentests.config.yaml.',
				'Created .agents/tests/.',
				`Created ${HOOK}.`,
				'Set OPENAI_API_KEY in .env or the environment.'
			]);
		});
	});

	test('the written config passes the loader', async () => {
		await inTempRepo({}, (dir) => {
			init(dir);
			const config = parseConfig(readFileSync(join(dir, 'agentests.config.yaml'), 'utf8'));
			expect(config).toMatchObject({
				decision: { api: 'openai', apiKeyEnv: 'OPENAI_API_KEY' },
				reasoning: { api: 'openai', apiKeyEnv: 'OPENAI_API_KEY' },
				select: { threshold: 0.5 },
				assert: { threshold: 0.5 }
			});
		});
	});

	test.each([
		['openai', 'OPENAI_API_KEY', 'openai', 'OPENAI_API_KEY'],
		['openai', 'OPENAI_API_KEY', 'anthropic', 'ANTHROPIC_API_KEY'],
		['jev', 'TYPESAFE_AI_API_KEY', 'openai', 'OPENAI_API_KEY'],
		['jev', 'TYPESAFE_AI_API_KEY', 'anthropic', 'ANTHROPIC_API_KEY']
	])(
		'--decision %s and --reasoning %s write the matching sections',
		async (decision, decisionKey, reasoning, reasoningKey) => {
			await inTempRepo({}, (dir) => {
				const result = init(dir, ['--decision', decision, '--reasoning', reasoning]);
				expect(result.exitCode).toBe(0);
				const config = parseConfig(readFileSync(join(dir, 'agentests.config.yaml'), 'utf8'));
				expect(config.decision).toMatchObject({ api: decision, apiKeyEnv: decisionKey });
				expect(config.reasoning).toMatchObject({ api: reasoning, apiKeyEnv: reasoningKey });
			});
		}
	);

	test.each([
		['an unknown decision provider', ['--decision', 'nope'], 'Unknown --decision provider "nope"'],
		['a reasoning-only provider for decision', ['--decision', 'anthropic'], '--decision'],
		['a decision-only provider for reasoning', ['--reasoning', 'jev'], '--reasoning']
	])('%s exits 2 and writes nothing', async (_name, args, error) => {
		await inTempRepo({}, (dir) => {
			const result = init(dir, args);
			expect(result.exitCode).toBe(2);
			expect(result.stderr).toContain(error);
			expect(existsSync(join(dir, 'agentests.config.yaml'))).toBe(false);
			expect(existsSync(join(dir, '.agents'))).toBe(false);
			expect(existsSync(join(dir, HOOK))).toBe(false);
		});
	});

	test('a second run changes no file', async () => {
		await inTempRepo({}, (dir) => {
			init(dir);
			const before = snapshot(dir);
			const result = init(dir);
			expect(result.exitCode).toBe(0);
			expect(snapshot(dir)).toEqual(before);
			expect(result.lines).toContain('.agents/tests/ already there.');
		});
	});

	test('an existing config is left alone and the template for the chosen providers is printed', async () => {
		await inTempRepo({ 'agentests.config.yaml': 'custom: true\n' }, (dir) => {
			const result = init(dir, ['--decision', 'jev', '--reasoning', 'anthropic']);
			expect(result.exitCode).toBe(0);
			expect(readFileSync(join(dir, 'agentests.config.yaml'), 'utf8')).toBe('custom: true\n');
			expect(result.stdout).toContain(
				'agentests.config.yaml exists; left it alone. Add what you need from:\n' +
					toYaml(toConfig('jev', 'anthropic'))
			);
		});
	});

	test('an existing hook without the command is left alone and the line to add is printed', async () => {
		await inTempRepo({}, (dir) => {
			writeFiles(dir, { [HOOK]: '#!/bin/sh\necho custom\n' });
			const result = init(dir);
			expect(result.exitCode).toBe(0);
			expect(readFileSync(join(dir, HOOK), 'utf8')).toBe('#!/bin/sh\necho custom\n');
			expect(result.lines).toContain(`${HOOK} exists; left it alone. Add: ${HOOK_COMMAND}`);
		});
	});

	test('an existing hook with the command is reported as already there', async () => {
		await inTempRepo({}, (dir) => {
			const hook = `#!/bin/sh\necho first\n${HOOK_COMMAND}\n`;
			writeFiles(dir, { [HOOK]: hook });
			const result = init(dir);
			expect(result.exitCode).toBe(0);
			expect(readFileSync(join(dir, HOOK), 'utf8')).toBe(hook);
			expect(result.lines).toContain(`${HOOK} already runs agentests.`);
		});
	});

	test('the hook is written under core.hooksPath', async () => {
		await inTempRepo({}, (dir) => {
			git(dir, 'config', 'core.hooksPath', '.githooks');
			const result = init(dir);
			expect(result.exitCode).toBe(0);
			expect(isExecutable(join(dir, '.githooks/pre-commit'))).toBe(true);
			expect(readFileSync(join(dir, '.githooks/pre-commit'), 'utf8')).toContain(HOOK_COMMAND);
			expect(existsSync(join(dir, HOOK))).toBe(false);
			expect(result.lines).toContain('Created .githooks/pre-commit.');
		});
	});

	test('outside a Git repository the config and Tests folder are written and the hook is skipped', async () => {
		await inTempDir({}, (dir) => {
			const result = init(dir, [], { GIT_CEILING_DIRECTORIES: dirname(dir) });
			expect(result.exitCode).toBe(0);
			expect(existsSync(join(dir, 'agentests.config.yaml'))).toBe(true);
			expect(statSync(join(dir, '.agents/tests')).isDirectory()).toBe(true);
			expect(existsSync(join(dir, '.git'))).toBe(false);
			expect(result.lines).toContain('Not a Git repository; skipped the pre-commit hook.');
		});
	});

	test.each([
		['openai', 'openai', 'Set OPENAI_API_KEY in .env or the environment.'],
		['openai', 'anthropic', 'Set OPENAI_API_KEY and ANTHROPIC_API_KEY in .env or the environment.'],
		['jev', 'openai', 'Set TYPESAFE_AI_API_KEY and OPENAI_API_KEY in .env or the environment.']
	])(
		'the key reminder for --decision %s and --reasoning %s names each variable once',
		async (decision, reasoning, reminder) => {
			await inTempRepo({}, (dir) => {
				const result = init(dir, ['--decision', decision, '--reasoning', reasoning]);
				expect(result.lines.at(-1)).toBe(reminder);
			});
		}
	);

	test('the key reminder is printed only when the config was created', async () => {
		await inTempRepo({ 'agentests.config.yaml': 'custom: true\n' }, (dir) => {
			const result = init(dir);
			expect(result.exitCode).toBe(0);
			expect(result.stdout).not.toContain('in .env or the environment.');
		});
	});
});

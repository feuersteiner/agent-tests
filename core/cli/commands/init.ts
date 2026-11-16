import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { command, type Command } from 'clinguini';
import { stringify } from 'yaml';
import { CONFIG_PATH } from '../../src/loader/index.ts';
import { TESTS_FOLDER } from '../config/paths.ts';
import { DECISION_PROVIDERS, REASONING_PROVIDERS, toConfig } from '../config/presets.ts';
import type { InitConfig } from '../config/presets.ts';
import { message } from '../helpers/error.ts';

/** The command the pre-commit hook runs; the package is pure Node, so `npx`. */
const HOOK_COMMAND = 'npx agent-tests run --staged';

/** The exit status Git uses for a fatal error, such as running outside a repository. */
const GIT_FATAL = 128;

/** The flag's value when it names one of `providers`; anything else is an error listing them. */
const toProvider = <T extends string>(flag: string, value: unknown, providers: T[]): T => {
	if (providers.includes(value as T)) return value as T;
	throw new Error(`Unknown --${flag} provider "${String(value)}"; use ${providers.join(' or ')}`);
};

/** Write the config; `wx` refuses to overwrite a file that appeared in the meantime. */
const writeConfig = (config: InitConfig): string[] => {
	writeFileSync(CONFIG_PATH, stringify(config), { flag: 'wx' });
	return [`Created ${CONFIG_PATH}.`];
};

/** That the existing config was left alone, followed by the template to copy from. */
const toKeptConfigLines = (config: InitConfig): string[] => [
	`${CONFIG_PATH} exists; left it alone. Add what you need from:`,
	stringify(config).trimEnd()
];

/** Create the Tests folder and its parents when missing; an existing one is left as it is. */
const createTestsFolder = (): string =>
	mkdirSync(TESTS_FOLDER, { recursive: true }) === undefined
		? `${TESTS_FOLDER}/ already there.`
		: `Created ${TESTS_FOLDER}/.`;

/** The pre-commit hook path Git reports, honoring `core.hooksPath`, or undefined outside a Git repository. */
const readHookPath = (): string | undefined => {
	try {
		return execFileSync('git', ['rev-parse', '--git-path', 'hooks/pre-commit'], {
			encoding: 'utf8',
			stdio: 'pipe'
		}).trim();
	} catch (error) {
		if ((error as { status?: number }).status === GIT_FATAL) return undefined;
		throw error;
	}
};

/** Write an executable `sh` pre-commit hook running `HOOK_COMMAND` when none exists; an existing hook is never touched. */
const writeHook = (): string => {
	const path = readHookPath();
	if (path === undefined) return 'Not a Git repository; skipped the pre-commit hook.';
	if (existsSync(path))
		return readFileSync(path, 'utf8').includes(HOOK_COMMAND)
			? `${path} already runs agent-tests.`
			: `${path} exists; left it alone. Add: ${HOOK_COMMAND}`;
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, `#!/bin/sh\n${HOOK_COMMAND}\n`, { flag: 'wx' });
	chmodSync(path, 0o755);
	return `Created ${path}.`;
};

/** `Set <name> and <name> in .env or the environment.`, each API key variable named once. */
const toKeyLine = ({ decision, reasoning }: InitConfig): string =>
	`Set ${[...new Set([decision.apiKeyEnv, reasoning.apiKeyEnv])].join(' and ')} in .env or the environment.`;

export const initCommand: Command = command({
	name: 'init',
	description: 'Write the config, the Tests folder, and a pre-commit hook.',
	flags: [
		{
			name: 'decision',
			type: 'string',
			default: 'openai',
			description: `Decision model provider: ${DECISION_PROVIDERS.join(' or ')}; default openai.`
		},
		{
			name: 'reasoning',
			type: 'string',
			default: 'openai',
			description: `Reasoning model provider: ${REASONING_PROVIDERS.join(' or ')}; default openai.`
		}
	],
	handler: ({ flags }): void => {
		try {
			const config = toConfig(
				toProvider('decision', flags.decision, DECISION_PROVIDERS),
				toProvider('reasoning', flags.reasoning, REASONING_PROVIDERS)
			);
			const created = !existsSync(CONFIG_PATH);
			for (const line of created ? writeConfig(config) : toKeptConfigLines(config))
				console.log(line);
			console.log(createTestsFolder());
			console.log(writeHook());
			if (created) console.log(toKeyLine(config));
			process.exitCode = 0;
		} catch (error) {
			console.error(`Error: ${message(error)}`);
			process.exitCode = 2;
		}
	}
});

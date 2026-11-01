import type { ParsedCommand } from './types.js';

interface CommandUsage {
	minimum: number;
	maximum: number;
	flags?: string[];
}

const scopes = ['changed', 'staged', 'base'];
const usages: Record<string, CommandUsage> = {
	init: { minimum: 0, maximum: 0, flags: ['hook', 'vitest', 'github'] },
	add: { minimum: 1, maximum: 2 },
	update: { minimum: 0, maximum: 1 },
	remove: { minimum: 1, maximum: 2 },
	compile: { minimum: 1, maximum: 1 },
	validate: { minimum: 0, maximum: 1 },
	list: { minimum: 0, maximum: 0, flags: ['remote'] },
	targets: { minimum: 1, maximum: 1, flags: scopes },
	eval: { minimum: 0, maximum: 1 },
	run: { minimum: 0, maximum: Infinity, flags: scopes },
	docs: { minimum: 0, maximum: 1 },
	vote: { minimum: 1, maximum: 1, flags: ['up', 'down'] }
};

/** Validate command-specific syntax before any library call or filesystem mutation. */
export const validateUsage = (parsed: ParsedCommand, help = false): void => {
	const usage = usages[parsed.command];
	if (!usage) throw new Error('Unknown command. Use agent-tests --help.');
	for (const option of Object.keys(parsed.options))
		if (option !== 'json' && !usage.flags?.includes(option))
			throw new Error(`Option --${option} is not supported by ${parsed.command}.`);
	if ((!help && parsed.args.length < usage.minimum) || parsed.args.length > usage.maximum)
		throw new Error(`Invalid arguments for ${parsed.command}. Use agent-tests --help.`);
	if (parsed.args.some((argument) => argument.length === 0))
		throw new Error('Arguments cannot be empty.');
	if (scopes.filter((scope) => parsed.options[scope] !== undefined).length > 1)
		throw new Error('Choose only one of --changed, --staged, or --base.');
	if (parsed.options.up && parsed.options.down) throw new Error('--up and --down are exclusive.');
};

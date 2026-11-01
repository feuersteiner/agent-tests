import { commands } from './help.js';
import type { ParsedCommand } from './types.js';

const flags = new Set([
	'json',
	'remote',
	'changed',
	'staged',
	'vitest',
	'github',
	'hook',
	'up',
	'down'
]);

/** Parse argv without I/O; reject unknown commands, flags and incomplete values. */
export const parse = (argv: string[]): ParsedCommand => {
	if (argv.includes('--help') || argv.includes('-h') || argv.length === 0)
		return { command: 'help', args: [], options: {} };
	if (argv[0] === '--version') return { command: 'version', args: [], options: {} };
	const [command = '', ...tokens] = argv;
	if (!commands.some((candidate) => candidate === command))
		throw new Error(`Unknown command: ${command}`);
	const parsed: ParsedCommand = { command, args: [], options: {} };
	for (let index = 0; index < tokens.length; index++) {
		const token = tokens[index]!;
		if (token === '--') {
			parsed.args.push(...tokens.slice(index + 1));
			break;
		}
		if (!token.startsWith('-')) {
			parsed.args.push(token);
			continue;
		}
		const key = token.slice(2);
		if (key === 'base') {
			const value = tokens[++index];
			if (!value || value.startsWith('-')) throw new Error('--base requires a Git reference');
			parsed.options.base = value;
		} else if (flags.has(key)) parsed.options[key] = true;
		else throw new Error(`Unknown option: ${token}`);
	}
	if (parsed.options.up && parsed.options.down) throw new Error('--up and --down are exclusive');
	return parsed;
};

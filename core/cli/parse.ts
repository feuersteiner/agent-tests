import { validateUsage } from './usage.js';
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
	if (argv.length === 0) return { command: 'help', args: [], options: {} };
	if (['--help', '-h', '--version'].includes(argv[0]!)) {
		if (argv.length !== 1) throw new Error('Global help and version take no other arguments.');
		return { command: argv[0] === '--version' ? 'version' : 'help', args: [], options: {} };
	}
	const [command = '', ...tokens] = argv;
	const parsed: ParsedCommand = { command, args: [], options: {} };
	let help = false;
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
		if (token === '--help' || token === '-h') {
			help = true;
			continue;
		}
		const separator = token.indexOf('=');
		const key = token.slice(2, separator === -1 ? undefined : separator);
		const inline = separator === -1 ? undefined : token.slice(separator + 1);
		if (!token.startsWith('--')) throw new Error('Only documented long options are supported.');
		if (parsed.options[key] !== undefined) throw new Error(`Option --${key} was supplied twice.`);
		if (key === 'base') {
			const value = inline ?? tokens[++index];
			if (!value || value.startsWith('-')) throw new Error('--base requires a Git reference');
			parsed.options.base = value;
		} else if (flags.has(key) && inline === undefined) parsed.options[key] = true;
		else throw new Error(`Unknown or invalid option: --${key}`);
	}
	validateUsage(parsed, help);
	if (help) return { command: 'help', args: [command], options: {} };
	return parsed;
};

export type Options = {
	json?: boolean;
	verbose?: boolean;
	changed?: boolean;
	staged?: boolean;
	base?: string;
	remote?: boolean;
	up?: boolean;
	down?: boolean;
};
export type Command = { name: string; args: string[]; options: Options };
const commands = new Set(['validate', 'run', 'eval', 'add', 'update', 'remove', 'list', 'vote']);

/** Parse documented syntax before touching files or configuration. */
export const parseArgs = (argv: string[]): Command => {
	if (!argv.length) return { name: 'help', args: [], options: {} };
	if (['--help', '-h', '--version'].includes(argv[0]!)) {
		if (argv.length !== 1) throw new Error('Global help and version take no arguments');
		return { name: argv[0] === '--version' ? 'version' : 'help', args: [], options: {} };
	}
	const [name = '', ...tokens] = argv;
	if (!commands.has(name)) throw new Error('Unknown command');
	const result: Command = { name, args: [], options: {} };
	let help = false;
	for (let index = 0; index < tokens.length; index++) {
		const token = tokens[index]!;
		if (token === '--') {
			result.args.push(...tokens.slice(index + 1));
			break;
		}
		if (!token.startsWith('-')) {
			result.args.push(token);
			continue;
		}
		if (token === '--help' || token === '-h') {
			help = true;
			continue;
		}
		const [key, ...parts] = token.slice(2).split('=');
		if (!token.startsWith('--') || !key || key in result.options)
			throw new Error('Invalid or repeated option');
		if (key === 'base' && name === 'run') {
			const value = parts.length ? parts.join('=') : tokens[++index];
			if (!value || value.startsWith('-')) throw new Error('--base requires a Git reference');
			result.options.base = value;
		} else if (
			!parts.length &&
			[
				'json',
				'verbose',
				...(name === 'run' ? ['changed', 'staged'] : []),
				...(name === 'list' ? ['remote'] : []),
				...(name === 'vote' ? ['up', 'down'] : [])
			].includes(key)
		) {
			(result.options as Record<string, unknown>)[key] = true;
		} else throw new Error('Unknown or invalid option');
	}
	if (['changed', 'staged', 'base'].filter((key) => key in result.options).length > 1)
		throw new Error('Choose one Git scope');
	if (result.options.json && result.options.verbose)
		throw new Error('--json and --verbose cannot be combined');
	if (
		result.args.some((arg) => !arg.length) ||
		(name === 'list' && result.args.length > 0) ||
		(['add', 'remove'].includes(name) &&
			((!help && !result.args.length) || result.args.length > 2)) ||
		(name === 'vote' && ((!help && !result.args.length) || result.args.length > 1)) ||
		(['validate', 'eval', 'update'].includes(name) && result.args.length > 1)
	)
		throw new Error('Invalid arguments');
	if (result.options.up && result.options.down) throw new Error('Choose one vote direction');
	if (result.options.verbose && !['run', 'eval'].includes(name))
		throw new Error('Verbose is only supported by run and eval');
	return help ? { name: 'help', args: [name], options: {} } : result;
};

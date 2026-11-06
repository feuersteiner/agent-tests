#!/usr/bin/env node
import { parseArgs } from './args.ts';
import { execute } from './run.ts';
import { executeLibrary } from './library/index.ts';
import { LOGO } from './logo.js';
import packageInfo from '../package.json' with { type: 'json' };
const { version } = packageInfo;

try {
	const command = parseArgs(process.argv.slice(2));
	if (command.name === 'version') console.log(version);
	else if (command.name === 'help') {
		console.log(LOGO);
		console.log(
			'agent-tests validate [id] [--json]\nagent-tests run [paths...] [--changed | --staged | --base REF] [--json | --verbose]\nagent-tests eval [id] [--json | --verbose]\nagent-tests add <id> [targetDir]\nagent-tests update [id]\nagent-tests remove <id> [targetDir]\nagent-tests list [--remote]\nagent-tests vote <id> [--up | --down]'
		);
	} else
		process.exitCode = await (['validate', 'run', 'eval'].includes(command.name)
			? execute(process.cwd(), command)
			: executeLibrary(process.cwd(), command));
} catch {
	const error = {
		exitCode: 2,
		error: 'Command failed: check syntax, configuration, and repository files. Use --help.'
	};
	if (process.argv.includes('--json')) console.error(JSON.stringify(error));
	else console.error(error.error);
	process.exitCode = 2;
}

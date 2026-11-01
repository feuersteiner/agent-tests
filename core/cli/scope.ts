import type { RunScope } from 'agent-tests';
import type { ParsedCommand } from './types.js';

/** Translate validated scope arguments into the public library's selection contract. */
export const scopeFor = (command: ParsedCommand): RunScope => ({
	...(command.command === 'run' && command.args.length ? { paths: command.args } : {}),
	...(command.options.changed ? { changed: true } : {}),
	...(command.options.staged ? { staged: true } : {}),
	...(typeof command.options.base === 'string' ? { base: command.options.base } : {})
});

#!/usr/bin/env -S bun --no-env-file
import { clinguini } from 'clinguini';
import { initCommand } from './commands/init.ts';
import { listCommand } from './commands/list.ts';
import { validateCommand } from './commands/validate.ts';
import { compileCommand } from './commands/compile.ts';
import { evalCommand } from './commands/eval.ts';
import { runCommand } from './commands/run.ts';
import { banner } from './config/banner.ts';

await clinguini({
	name: 'agent-tests',
	description: 'Reusable repository checks for lessons learned during agent sessions.',
	commands: [initCommand, compileCommand, listCommand, validateCommand, evalCommand, runCommand],
	utils: {
		help: true,
		header: banner()
	}
});

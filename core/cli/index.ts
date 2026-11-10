#!/usr/bin/env -S bun --no-env-file
import { clinguini } from 'clinguini';
import { initCommand } from './commands/init.ts';
import { addCommand } from './commands/add.ts';
import { listCommand } from './commands/list.ts';
import { validateCommand } from './commands/validate.ts';
import { targetsCommand } from './commands/targets.ts';
import { compileCommand } from './commands/compile.ts';
import { evalCommand } from './commands/eval.ts';
import { runCommand } from './commands/run.ts';
import { docsCommand } from './commands/docs.ts';
import { voteCommand } from './commands/vote.ts';
import { banner } from './config/banner.ts';

await clinguini({
	name: 'agent-tests',
	description: 'Reusable repository checks for lessons learned during agent sessions.',
	commands: [
		initCommand,
		addCommand,
		listCommand,
		validateCommand,
		targetsCommand,
		compileCommand,
		evalCommand,
		runCommand,
		docsCommand,
		voteCommand
	],
	utils: {
		help: true,
		header: banner()
	}
});

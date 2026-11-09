#!/usr/bin/env -S bun --no-env-file
import { clinguini } from 'clinguini';
import { initCommand } from './init.ts';
import { addCommand } from './add.ts';
import { listCommand } from './list.ts';
import { validateCommand } from './validate.ts';
import { targetsCommand } from './targets.ts';
import { compileCommand } from './compile.ts';
import { evalCommand } from './eval.ts';
import { runCommand } from './run.ts';
import { docsCommand } from './docs.ts';
import { voteCommand } from './vote.ts';
import { LOGO } from './logo.ts';

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
		header: LOGO
	}
});

#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { clinguini } from 'clinguini';
import { initCommand } from './commands/init/index.ts';
import { listCommand } from './commands/list.ts';
import { validateCommand } from './commands/validate.ts';
import { compileCommand } from './commands/compile/index.ts';
import { evalCommand } from './commands/eval.ts';
import { runCommand } from './commands/run.ts';
import { banner } from './config/banner.ts';

/** Load the working directory's `.env`, if any; variables already set in the environment win. */
if (existsSync('.env')) process.loadEnvFile('.env');

await clinguini({
	name: 'agentests',
	description:
		'Linting for intelligence: plain-language rules compiled into engineered checks and proved on your own evals.',
	commands: [initCommand, compileCommand, listCommand, validateCommand, evalCommand, runCommand],
	utils: {
		help: true,
		header: process.stdout.isTTY ? banner() : undefined
	}
});

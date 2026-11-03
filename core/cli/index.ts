#!/usr/bin/env node
import { runCommand } from './run-command.js';

const output = await runCommand(process.argv.slice(2));
if (output.stdout) process.stdout.write(`${output.stdout.trimEnd()}\n`);
if (output.stderr) process.stderr.write(`${output.stderr.trimEnd()}\n`);
process.exitCode = output.exitCode;

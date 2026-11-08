#!/usr/bin/env bun
import { clinguini } from 'clinguini';
import { LOGO } from './logo.ts';

await clinguini({
	name: 'agent-tests',
	description: 'Reusable repository checks for lessons learned during agent sessions.',
	utils: {
		help: true,
		header: LOGO
	}
});

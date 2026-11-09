#!/usr/bin/env bun
// Stopgap for `agent-tests validate` until the CLI implements it. Needs no API keys.
// Usage: bun validate.ts <test-dir>
// Env:   AGENT_TESTS_CORE=/path/to/agent-tests/core   (required)
// Exits 1 on errors; warnings alone exit 0.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, join, resolve } from 'node:path';

const core = process.env.AGENT_TESTS_CORE;
const [testDir] = process.argv.slice(2);
if (!core || !testDir) {
	console.error('Usage: AGENT_TESTS_CORE=<agent-tests/core> bun validate.ts <test-dir>');
	process.exit(2);
}

const { validateTest } = await import(join(core, 'index.ts'));
const { parseYaml } = await import(join(core, 'src/config/parse.ts'));
// Resolve minimatch from core so the glob semantics match the runtime exactly.
const { minimatch } = createRequire(join(core, 'package.json'))('minimatch');

const errors: string[] = [];
const warnings: string[] = [];
const dir = resolve(testDir);
const yamlPath = join(dir, 'test.yaml');
const mdPath = join(dir, 'TEST.md');

if (!existsSync(yamlPath)) {
	console.error(`error  ${yamlPath} not found`);
	process.exit(1);
}

let test: any;
try {
	test = validateTest(parseYaml(readFileSync(yamlPath, 'utf8')));
} catch (e) {
	console.error(`error  ${(e as Error).message}`);
	process.exit(1);
}

// id matches directory
if (test.id !== basename(dir))
	errors.push(`id "${test.id}" does not match directory "${basename(dir)}"`);

// source hash matches TEST.md
if (existsSync(mdPath)) {
	const hash = `sha256:${createHash('sha256').update(readFileSync(mdPath)).digest('hex')}`;
	if (!test.source) warnings.push(`source missing; set: source: ${hash}`);
	else if (test.source !== hash)
		errors.push(`stale: TEST.md changed since compile; set: source: ${hash}`);
} else {
	warnings.push('TEST.md not found; source cannot be checked');
}

// eval coverage
const labels = new Set(test.evals.map((e: any) => e.expect));
for (const label of ['fail', 'pass', 'skip']) {
	if (!labels.has(label)) errors.push(`no "${label}" eval`);
}
const names = new Set<string>();
for (const e of test.evals) {
	if (names.has(e.name)) warnings.push(`duplicate eval name "${e.name}"`);
	names.add(e.name);
}

// glob routing: deterministic only, ignores grep/ask (which may still deselect)
const triggers: any[] = test.triggers ?? [];
const opts = { dot: true, platform: 'linux' };
const globOk = (t: any, path: string) =>
	!t.glob || [t.glob].flat().some((g: string) => minimatch(path, g, opts));
for (const e of test.evals) {
	if (triggers.length === 0) {
		if (e.expect === 'skip')
			errors.push(`eval "${e.name}": expect skip, but no triggers select every file`);
		continue;
	}
	const reachable = triggers.filter((t) => globOk(t, e.path));
	if (e.expect !== 'skip' && reachable.length === 0)
		errors.push(`eval "${e.name}": expect ${e.expect}, but no trigger glob matches ${e.path}`);
	if (e.expect === 'skip') {
		const certain = reachable.filter((t) => !t.grep && !t.ask);
		if (certain.length)
			errors.push(
				`eval "${e.name}": expect skip, but glob-only trigger "${certain[0].id}" selects ${e.path}`
			);
	}
}

// checks that run a model on every selected file
for (const c of test.checks) {
	if (!c.grep && (c.ask || c.reason))
		warnings.push(`check "${c.id}": no grep, so every selected file costs a model call`);
}

for (const w of warnings) console.log(`warning  ${w}`);
for (const e of errors) console.log(`error  ${e}`);
console.log(`${test.id}: ${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);

#!/usr/bin/env bun
// Stopgap for `agent-tests run` until the CLI implements it.
// Usage: bun run-all.ts [--changed | --staged | --base <ref>] [--test <id>]...
// Env:   AGENT_TESTS_CORE=/path/to/agent-tests/core   (required)
// Run from the repository root; reads agent-tests.config.yaml there.
// Every .agents/tests/<id>/test.yaml in the repo is a test. A test under <dir>/.agents/tests/
// applies only to files under <dir>, and its globs and eval paths are relative to <dir>.
// Exit: 0 no findings, 1 findings, 2 setup error or invalid tests.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const core = process.env.AGENT_TESTS_CORE;
if (!core) {
	console.error('Set AGENT_TESTS_CORE=<agent-tests/core>');
	process.exit(2);
}
const { AgentTest, Source } = await import(join(core, 'index.ts'));
const { parseYaml } = await import(join(core, 'src/config/parse.ts'));

// ---- arguments
const args = process.argv.slice(2);
let mode: 'all' | 'changed' | 'staged' | 'base' = 'all';
let base = '';
const only: string[] = [];
for (let i = 0; i < args.length; i++) {
	const a = args[i];
	if (a === '--changed') mode = 'changed';
	else if (a === '--staged') mode = 'staged';
	else if (a === '--base') ((mode = 'base'), (base = args[++i] ?? ''));
	else if (a === '--test') only.push(args[++i] ?? '');
	else {
		console.error(`Unknown argument: ${a}`);
		process.exit(2);
	}
}
if (mode === 'base' && !base) {
	console.error('--base needs a git ref, e.g. --base main');
	process.exit(2);
}

const git = (...cmd: string[]): string[] => {
	const r = Bun.spawnSync(['git', ...cmd]);
	if (r.exitCode !== 0) {
		console.error(`git ${cmd.join(' ')} failed: ${r.stderr.toString().trim()}`);
		process.exit(2);
	}
	return r.stdout.toString().split('\n').filter(Boolean);
};

// ---- files to inspect (repo-relative, existing, regular files)
const pick = {
	all: () => [...git('ls-files'), ...git('ls-files', '--others', '--exclude-standard')],
	changed: () => [
		...git('diff', '--name-only', 'HEAD'),
		...git('ls-files', '--others', '--exclude-standard')
	],
	staged: () => git('diff', '--name-only', '--cached'),
	base: () => [
		...git('diff', '--name-only', `${base}...HEAD`),
		...git('diff', '--name-only', 'HEAD')
	]
}[mode];
const files = [...new Set(pick())].filter((f) => existsSync(f) && statSync(f).isFile());

// ---- tests: every .agents/tests/<id>/test.yaml anywhere in the repo
const allPaths = [...git('ls-files'), ...git('ls-files', '--others', '--exclude-standard')];
const testFiles = [...new Set(allPaths)]
	.filter((p) => /(^|\/)\.agents\/tests\/[^/]+\/test\.yaml$/.test(p))
	.filter((p) => only.length === 0 || only.includes(dirname(p).split('/').pop()!));
if (testFiles.length === 0) {
	console.log('No agent tests found under .agents/tests/.');
	process.exit(0);
}

const config = parseYaml(readFileSync('agent-tests.config.yaml', 'utf8'));

// ---- run
type Finding = { file: string; lines: number[]; test: string; check: string; error: string };
const findings: Finding[] = [];
const invalid: string[] = [];
let inspected = 0;

for (const testFile of testFiles) {
	const testDir = dirname(testFile);
	const owner = dirname(dirname(dirname(testDir))); // <owner>/.agents/tests/<id>
	const prefix = owner === '.' ? '' : owner + '/';
	const scoped = files.filter(
		(f) => f.startsWith(prefix) && !f.includes('/.agents/tests/') && !f.startsWith('.agents/tests/')
	);

	let test: any;
	try {
		const sources = scoped.map(
			(f) => new Source(relative(owner, f), async () => readFileSync(f, 'utf8'))
		);
		test = new AgentTest(sources, parseYaml(readFileSync(testFile, 'utf8')), config);
	} catch (e) {
		invalid.push(`${testFile}: ${(e as Error).message.split('\n').join('; ')}`);
		continue;
	}
	if (scoped.length === 0) continue;

	const { trigger, check } = await test.run(false);
	inspected += test.trigger.selected(test.sources, trigger).length;
	for (const { source, check: c } of check.flagged) {
		const file = prefix + source.path;
		// Line hints come from the check's grep patterns; model-only checks have none.
		const lines: number[] = [];
		if (c.grep) {
			const res = [c.grep].flat().map((p: string) => new RegExp(p));
			readFileSync(file, 'utf8')
				.split('\n')
				.forEach((line, i) => res.some((r) => r.test(line)) && lines.push(i + 1));
		}
		findings.push({ file, lines, test: test.test.id, check: c.id, error: c.error });
	}
}

// ---- report
findings.sort((a, b) => a.file.localeCompare(b.file) || a.test.localeCompare(b.test));
for (const f of findings) {
	const where = f.lines.length ? `${f.file}:${f.lines.join(',')}` : f.file;
	console.log(`${where}  error  ${f.error}  (${f.test}/${f.check})`);
}
for (const i of invalid) console.log(`invalid test  ${i}`);
console.log(
	`${testFiles.length} test(s), ${files.length} file(s) in scope (${mode}), ` +
		`${inspected} selected, ${findings.length} finding(s), ${invalid.length} invalid test(s)`
);
process.exit(invalid.length ? 2 : findings.length ? 1 : 0);

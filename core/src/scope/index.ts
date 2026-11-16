import { execFileSync } from 'node:child_process';
import { lstatSync, readdirSync } from 'node:fs';
import { join, posix, sep } from 'node:path';
import { Minimatch } from 'minimatch';
import { DirectorySource, FileSource } from '../sources/index.ts';
import type { Source } from '../sources/index.ts';
import type { AgentTestScope } from './types.ts';

/** Changed paths below the working directory and relative to it, without deletions. */
const DIFF = ['diff', '--name-only', '-z', '--relative', '--diff-filter=d'];

/** Untracked paths below the working directory and relative to it, without Git-ignored ones. */
const UNTRACKED = ['ls-files', '--others', '--exclude-standard', '-z'];

/** How `ignore` globs match: dotfiles included, forward slashes only. */
const IGNORE_OPTIONS = { dot: true, platform: 'linux' } as const;

/** Builds the list of sources a run looks at. */
export class ScopeOrchestrator {
	private readonly globs: Minimatch[];

	constructor(private readonly ignore: string[]) {
		this.globs = this.ignore.map((pattern) => new Minimatch(pattern, IGNORE_OPTIONS));
	}

	/** Every file Git lists for the scope that counts, and its ancestor directories, sorted by path. */
	public readonly run = (scope: AgentTestScope): Source[] => {
		console.log(`Scoping ${scope.kind} sources`);
		return this.toSources(this.listFiles(scope), '.');
	};

	/** Every file under `folder` that counts, and its ancestor directories, sorted by path, with `folder` as the repository root; needs no Git. */
	public readonly runFolder = (folder: string): Source[] => {
		console.log(`Scoping sources in ${folder}`);
		const paths = readdirSync(folder, { recursive: true, encoding: 'utf8' });
		return this.toSources(
			paths.map((path) => path.split(sep).join(posix.sep)),
			folder
		);
	};

	/** The kept files among `paths`, relative to `root`, and their ancestor directories, as sources sorted by path. */
	private readonly toSources = (paths: string[], root: string): Source[] => {
		const files = new Set(paths.filter((path) => this.isKept(path, root)));
		const all = [...new Set([...files].flatMap(this.withAncestors))].sort();
		const sources = all.map((path) =>
			files.has(path) ? new FileSource(path, root) : new DirectorySource(path, root)
		);
		console.log(`${sources.length} source(s) in scope`);
		return sources;
	};

	/** The file paths Git lists for the scope. */
	private readonly listFiles = (scope: AgentTestScope): string[] => {
		if (scope.kind === 'all') return this.git([...UNTRACKED, '--cached']);
		if (scope.kind === 'staged') return this.git([...DIFF, '--cached']);
		if (scope.kind === 'base')
			return this.git([...DIFF, '--end-of-options', `${scope.ref}...HEAD`, '--']);
		return [...this.git([...DIFF, 'HEAD']), ...this.git(UNTRACKED)];
	};

	/** The NUL-separated paths a Git command prints; its stderr goes into the thrown error. */
	private readonly git = (args: string[]): string[] =>
		execFileSync('git', args, { encoding: 'utf8', stdio: 'pipe', maxBuffer: 256 * 1024 * 1024 })
			.split('\0')
			.filter((path) => path !== '');

	/** Kept when no `ignore` glob excludes it and it is a regular file under `root` on disk right now. */
	private readonly isKept = (path: string, root: string): boolean =>
		!this.isIgnored(path) &&
		lstatSync(join(root, path), { throwIfNoEntry: false })?.isFile() === true;

	/** Ignored when a glob matches the file or an ancestor directory, a directory also with a trailing slash. */
	private readonly isIgnored = (path: string): boolean =>
		this.withAncestors(path).some((candidate) =>
			this.globs.some(
				(glob) => glob.match(candidate) || (candidate !== path && glob.match(`${candidate}/`))
			)
		);

	/** The path and each ancestor directory of it, without the root itself. */
	private readonly withAncestors = (path: string): string[] => {
		const parent = posix.dirname(path);
		return parent === '.' ? [path] : [path, ...this.withAncestors(parent)];
	};
}

import type { RunScope } from '../discovery/index.js';
import type { TestDefinition } from '../schema/index.js';

/** Optional repository root and explicit file selection for the Vitest project. */
export interface AgentTestsOptions {
	root?: string;
	scope?: RunScope;
	base?: string;
}

/** Serializable candidate data, with a path relative to the owning rule package. */
export interface HostedTarget {
	path: string;
	absolutePath: string;
	ownerPath: string;
	content: string;
	skipped?: string;
}

/** Each installed definition becomes one generated describe block. */
export interface HostedGroup {
	owner: string;
	definition: TestDefinition;
	targets: HostedTarget[];
}

/** Only serializable, non-credential data crosses the Vitest worker boundary. */
export interface HostedContext {
	root: string;
	cacheDirectory: string;
	groups: HostedGroup[];
	scope: RunScope;
	error?: string;
}

declare module 'vitest' {
	export interface ProvidedContext {
		agentTests: HostedContext;
	}
}

import type { TestDefinition } from '../schema/index.js';

/** A compiled test and the subtree where its rule applies. */
export interface DiscoveredTest {
	id: string;
	owner: string;
	directory: string;
	definition: TestDefinition;
	disabledIn: string[];
}

/** A text file selected from the working tree or staged Git snapshot. */
export interface CandidateFile {
	path: string;
	absolutePath: string;
	content: string;
}

/** Optional path filters and one Git change selection. */
export interface RunScope {
	paths?: string[];
	changed?: boolean;
	staged?: boolean;
	base?: string;
}

/** A package's local exemptions from inherited tests. */
export interface TestPackage {
	owner: string;
	directory: string;
	disable: string[];
	tests: DiscoveredTest[];
}

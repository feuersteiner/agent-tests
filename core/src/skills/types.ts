/** A bundled, printable workflow supplied to the developer's agent. */
export interface SkillSummary {
	name: string;
	description: string;
}

/** Source material found in an installed test directory. */
export interface CompilationSource {
	directory: string;
	text: string;
	sourceHash: string;
}

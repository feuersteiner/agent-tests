/** An owner-relative POSIX path and the file text available to triggers. */
export interface TriggerTarget {
	path: string;
	content: string;
}

/** A selected, rejected, or unresolved trigger decision with explanatory warnings. */
export interface TriggerResult {
	matched: boolean;
	skipped: boolean;
	warnings: string[];
}

/** Selected files and files whose selection requires an available, decisive model. */
export interface TargetSelection {
	targets: TriggerTarget[];
	skipped: TriggerTarget[];
	warnings: string[];
}

/** Repository-relative targets and unresolved selections for one installed test. */
export interface TargetFilesResult {
	testId: string;
	files: string[];
	skipped: string[];
	warnings: string[];
	exitCode: 0;
}

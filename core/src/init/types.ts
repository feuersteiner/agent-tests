/** Optional integrations installed only when explicitly selected. */
export interface InitOptions {
	hook?: boolean;
	vitest?: boolean;
	github?: boolean;
}

/** Paths are relative to root; skipped files are preserved byte for byte. */
export interface InitResult {
	root: string;
	created: string[];
	skipped: string[];
	warnings: string[];
	exitCode: 0 | 2;
}

/** A safe configuration edit, or a reason the original must remain unchanged. */
export interface ConfigEdit {
	content?: string;
	reason?: string;
}

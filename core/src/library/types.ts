import type { DecisionModel } from '../models/index.js';
import type { EvalResult } from '../evals/index.js';

/** Configured pinned catalog and optional model shared by one library operation. */
export interface CatalogContext {
	catalog: LibraryCatalog;
	repository: string;
	ref: string;
	model?: DecisionModel;
}

/** A catalog snapshot pins all reads to one exact Git commit. */
export interface LibraryCatalog {
	commit: string;
	ids: string[];
	readTest: (id: string) => Promise<LibraryFiles>;
	close: () => Promise<void>;
}

/** Only these two catalog files are installed. */
export interface LibraryFiles {
	prose: string;
	yaml: string;
}

/** Injectable catalog access keeps unit tests offline. */
export interface LibraryTransport {
	open: (repository: string, ref: string) => Promise<LibraryCatalog>;
}

/** Optional deterministic transport and decision model for library operations. */
export interface LibraryOptions {
	transport?: LibraryTransport;
	model?: DecisionModel;
}

/** Installed provenance records original file hashes without storing credentials. */
export interface LibrarySource {
	version: 1;
	repository: string;
	ref: string;
	commit: string;
	proseHash: string;
	yamlHash: string;
}

/** Exact original payload and metadata snapshot used for last-moment conflict detection. */
export interface ManagedSourceSnapshot {
	source: LibrarySource;
	fingerprint: string;
}

/** One install, update or removal outcome; skipped changes preserve local files. */
export interface LibraryResult {
	id: string;
	directory: string;
	status: 'added' | 'updated' | 'removed' | 'unchanged' | 'skipped';
	commit?: string;
	brief?: string;
	evals?: EvalResult;
	warnings: string[];
	exitCode: 0 | 1 | 2;
}

/** Remote listing exposes identity and provenance, never voters or credentials. */
export interface RemoteTest {
	id: string;
	commit: string;
}

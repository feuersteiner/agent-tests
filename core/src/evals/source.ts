import { DirectorySource, FileSource } from '../shared/source.ts';
import type { Source } from '../shared/source.ts';
import type { EvalSource } from './types.ts';

/** Build caller-owned fixture sources without touching the filesystem. */
export const exampleSource = (example: EvalSource): Source =>
	'content' in example
		? new FileSource(example.path, async () => example.content)
		: new DirectorySource(example.path, async () => example.children.map(exampleSource));

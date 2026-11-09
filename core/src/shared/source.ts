import { posix } from 'node:path';

/** Caller-owned file contents, read once even when engines run concurrently. */
export class FileSource {
	public readonly kind = 'file' as const;
	private content?: Promise<string>;

	constructor(
		public readonly path: string,
		private readonly getter: () => Promise<string>
	) {}

	public readonly open = (): Promise<string> => {
		return (this.content ??= Promise.resolve()
			.then(this.getter)
			.catch((error) => {
				this.content = undefined;
				throw error;
			}));
	};

	/** Empty files have zero lines; a terminal newline does not add an empty line. */
	public readonly lineCount = async (): Promise<number> => {
		const content = await this.open();
		return content.length === 0
			? 0
			: content.split(/\r\n|\r|\n/).length - Number(/[\r\n]$/.test(content));
	};
}

export type Source = FileSource | DirectorySource;
export type TypedSource = Source;
export type DirectoryChild =
	{ name: string; kind: 'file'; lines: number } | { name: string; kind: 'directory' };
export type DirectorySnapshot = { name: string; children: DirectoryChild[] };

/** A directory keeps its children as sources; opening it only summarizes one level. */
export class DirectorySource {
	public readonly kind = 'directory' as const;
	private entries?: Promise<TypedSource[]>;
	private snapshot?: Promise<DirectorySnapshot>;

	constructor(
		public readonly path: string,
		private readonly getter: () => Promise<TypedSource[]>
	) {}

	public readonly children = (): Promise<TypedSource[]> => {
		return (this.entries ??= Promise.resolve()
			.then(this.getter)
			.catch((error) => {
				this.entries = undefined;
				throw error;
			}));
	};

	public readonly open = (): Promise<DirectorySnapshot> => {
		return (this.snapshot ??= this.summarize().catch((error) => {
			this.snapshot = undefined;
			throw error;
		}));
	};

	private readonly summarize = async (): Promise<DirectorySnapshot> => ({
		name: posix.basename(this.path) || '.',
		children: await Promise.all(
			(await this.children()).map(async (child): Promise<DirectoryChild> => {
				const name = posix.basename(child.path);
				return child.kind === 'file'
					? { name, kind: 'file', lines: await child.lineCount() }
					: { name, kind: 'directory' };
			})
		)
	});
}

/** AI sees structured directory metadata; file input remains unchanged. */
export const sourceInput = async (source: TypedSource): Promise<string> => {
	const content = await source.open();
	return typeof content === 'string' ? content : JSON.stringify(content);
};

import type { Finding } from './types.ts';

/** A lazily read source snapshot shared by triggers, checks, and explanations. */
export class Source {
	private content?: string;

	constructor(
		public readonly path: string,
		private readonly getter: () => Promise<string>
	) {}

	/** Locate an exact grep offset, or every occurrence of a quoted AI failure. */
	public readonly locate = async (
		quote: string,
		reason?: string,
		at?: number
	): Promise<Finding[]> => {
		if (!quote && at === undefined) return [];
		const content = await this.open();
		if (
			at !== undefined &&
			(!Number.isInteger(at) ||
				at < 0 ||
				at > content.length ||
				content.slice(at, at + quote.length) !== quote)
		)
			return [];
		const findings: Finding[] = [];
		let offset = at ?? content.indexOf(quote);
		while (offset !== -1) {
			const before = content.slice(0, offset).split(/\r\n|\n|\r/);
			findings.push({
				quote,
				...(reason === undefined ? {} : { reason }),
				line: before.length,
				column: before.at(-1)!.length + 1
			});
			offset = at === undefined ? content.indexOf(quote, offset + 1) : -1;
		}
		return findings;
	};

	/** Cache resolved content; concurrent reads may repeat and failed reads can retry. */
	public readonly open = async (): Promise<string> => {
		return (this.content ??= await this.getter());
	};
}

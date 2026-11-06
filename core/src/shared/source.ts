import type { Finding } from './types.ts';

/** A lazily read source snapshot shared by triggers, checks, and explanations. */
export class Source {
	private content?: Promise<string>;

	constructor(
		public readonly path: string,
		private readonly getter: () => Promise<string>
	) {}

	/** Resolve every exact occurrence; quotes never supply their own locations. */
	public readonly locate = async (quote: string, reason?: string): Promise<Finding[]> => {
		if (!quote) return [];
		const content = await this.open();
		const findings: Finding[] = [];
		let offset = content.indexOf(quote);
		while (offset !== -1) {
			const before = content.slice(0, offset).split(/\r\n|\n|\r/);
			findings.push({
				quote,
				...(reason === undefined ? {} : { reason }),
				line: before.length,
				column: before.at(-1)!.length + 1
			});
			offset = content.indexOf(quote, offset + Math.max(quote.length, 1));
		}
		return findings;
	};

	/** Read once, including failures, so every stage inspects the same content. */
	public readonly open = (): Promise<string> => {
		this.content ??= Promise.resolve().then(this.getter);
		return this.content;
	};
}

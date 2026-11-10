/** The agent-tests shield as pixel art: each half-block character is one square pixel. */
export const LOGO = `
   ▄▄▄████▄▄▄
████████████████
████████████████
███▀▀▀▀██▀▀▀▀███
███    ██    ███
███▄▄▄▄██▄▄▄▄███
 ██▀▀██████████
 ▀████████████▀
   ▀████████▀
     ▀████▀
`;

const LETTERS: Record<string, string[]> = {
	A: [' ██ ', '█  █', '████', '█  █', '█  █'],
	G: [' ███', '█   ', '█ ██', '█  █', ' ███'],
	E: ['████', '█   ', '███ ', '█   ', '████'],
	N: ['█  █', '██ █', '█ ██', '█  █', '█  █'],
	T: ['████', ' ██ ', ' ██ ', ' ██ ', ' ██ '],
	S: [' ███', '█   ', ' ██ ', '   █', '███ '],
	' ': ['  ', '  ', '  ', '  ', '  ']
};

const wordmark = (text: string): string[] => {
	return Array.from({ length: 5 }, (_, row) =>
		[...text].map((letter) => LETTERS[letter]![row]).join(' ')
	);
};

/** Shade solid cells only, preserving the shield's half-block edges and spaces. */
const shade = (lines: string[]): string[] => {
	const width = Math.max(...lines.map((line) => line.length));
	return lines.map((line) =>
		[...line]
			.map((pixel, column) =>
				pixel === '█' ? '█▓▒░'[Math.min(3, Math.floor((column * 4) / width))] : pixel
			)
			.join('')
	);
};

export const banner = (columns = process.stdout.columns || 80): string => {
	const width = Math.max(1, Math.floor(columns));
	const shield = shade(LOGO.trimEnd().slice(1).split('\n'));
	const title = shade(wordmark('AGENT TESTS'));
	let lines: string[];

	if (width >= 16 + 3 + title[0]!.length + 4)
		lines = shield.map((line, row) => `  ${line.padEnd(16)}   ${title[row - 2] ?? ''}`);
	else {
		const words =
			title[0]!.length <= width
				? title
				: [...shade(wordmark('AGENT')), '', ...shade(wordmark('TESTS'))];
		lines = [...shield, '', ...words].map(
			(line) =>
				' '.repeat(Math.max(0, Math.floor((width - line.length) / 2))) + line.slice(0, width)
		);
	}

	const rule = '─'.repeat(width);
	return `\n${rule}\n${lines.map((line) => line.trimEnd()).join('\n')}\n${rule}\n`;
};

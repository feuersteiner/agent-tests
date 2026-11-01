const handle = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/;

/** Read a canonical score file; reject hidden rows, duplicates and non-LF edits. */
export const scoreRows = (text: string): string[] => {
	if (!text.endsWith('\n')) throw new Error('score.csv must end with a newline.');
	const [header, ...rows] = text.slice(0, -1).split('\n');
	if (header !== 'github_handle' || rows.some((row) => !handle.test(row)))
		throw new Error('score.csv has an invalid header or GitHub handle.');
	if (new Set(rows.map((row) => row.toLowerCase())).size !== rows.length)
		throw new Error('score.csv contains duplicate handles.');
	return rows;
};

/** Change only the authenticated user's row while preserving every other row and its order. */
export const updateScore = (text: string, login: string, up: boolean): string => {
	if (!handle.test(login)) throw new Error('GitHub returned an invalid account handle.');
	const rows = scoreRows(text);
	const index = rows.findIndex((row) => row.toLowerCase() === login.toLowerCase());
	if (up && index < 0) rows.push(login);
	if (!up && index >= 0) rows.splice(index, 1);
	return ['github_handle', ...rows].join('\n') + '\n';
};

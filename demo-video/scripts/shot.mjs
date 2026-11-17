// Saves frames of the film as PNGs from an already running server, for example:
// node scripts/shot.mjs --t 12.5 --t 14 [--url http://localhost:5183] [--out output/shots]
import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { defaultUrl, filmDuration, openFilm, root, seek } from './browser.mjs';

const { values } = parseArgs({
	options: {
		t: { type: 'string', multiple: true },
		url: { type: 'string', default: defaultUrl },
		out: { type: 'string', default: 'output/shots' }
	}
});
const times = (values.t ?? []).map(Number);
if (!times.length || times.some((time) => !Number.isFinite(time) || time < 0))
	throw new Error('Pass one or more non-negative --t <seconds>, for example --t 12.5.');
const out = resolve(root, values.out);
await mkdir(out, { recursive: true });

const film = await openFilm({ url: values.url });
try {
	const duration = await filmDuration(film.page);
	const late = times.filter((time) => time > duration);
	if (late.length) throw new Error(`The film ends at ${duration} s; got --t ${late.join(', ')}.`);
	for (const time of times) {
		await seek(film.page, time);
		const path = join(out, `t-${time.toFixed(2)}.png`);
		await film.page.screenshot({ path, animations: 'disabled' });
		console.log(path);
	}
	if (film.errors.length) {
		console.error(`The page reported errors:\n${film.errors.join('\n')}`);
		process.exitCode = 1;
	}
} finally {
	await film.close();
}

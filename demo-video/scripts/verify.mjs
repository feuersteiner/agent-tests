// Checks that the film is renderable without producing a video, one line per check:
// node scripts/verify.mjs [--url http://localhost:5183] [--port 4177]
import { mkdir, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { filmDuration, openFilm, root, seek, serveFilm } from './browser.mjs';

/** Film seconds between the samples that find the scenes; every scene is longer. */
const step = 0.5;
/** Where frames that differ between two seeks are saved for inspection. */
const review = resolve(root, 'output/verify');

const { values } = parseArgs({
	args: process.argv.slice(2).filter((arg, index) => index || arg !== '--'),
	options: {
		url: { type: 'string' },
		port: { type: 'string', default: '4177' }
	}
});

let failures = 0;
const report = (name, passed, detail) => {
	if (!passed) failures++;
	console.log(
		`${passed ? 'PASS' : 'FAIL'}  ${name.padEnd(13)}${detail.replace(/\s*\n\s*/g, ' · ')}`
	);
};
/** Runs one check; an exception fails that check instead of stopping the others. */
const check = async (name, run) => {
	try {
		const { passed, detail } = await run();
		report(name, passed, detail);
	} catch (error) {
		report(name, false, error.message);
	}
};

const round = (seconds) => Math.round(seconds * 100) / 100;
const list = (times) => `${times.join(', ')} s`;

/** The share of a PNG's pixels that clearly differ from its top-left pixel, measured in a blank page. */
const inkShare = async (browser, png) => {
	const page = await browser.newPage();
	try {
		return await page.evaluate(async (base64) => {
			const response = await fetch(`data:image/png;base64,${base64}`);
			const bitmap = await createImageBitmap(await response.blob());
			const context = new OffscreenCanvas(bitmap.width, bitmap.height).getContext('2d');
			context.drawImage(bitmap, 0, 0);
			const { data } = context.getImageData(0, 0, bitmap.width, bitmap.height);
			let ink = 0;
			for (let index = 0; index < data.length; index += 4) {
				const distance = Math.max(
					Math.abs(data[index] - data[0]),
					Math.abs(data[index + 1] - data[1]),
					Math.abs(data[index + 2] - data[2])
				);
				if (distance > 24) ink++;
			}
			return ink / (data.length / 4);
		}, png.toString('base64'));
	} finally {
		await page.close();
	}
};

const verify = async (film) => {
	const { page } = film;
	const screenshot = () => page.screenshot({ animations: 'disabled' });
	// The expected length and scenes are the film's own timeline, as the player exposes it.
	const duration = await filmDuration(page);
	const timeline = (await page.evaluate(() => window.__film.scenes)) ?? [];
	const total = timeline.reduce((sum, scene) => sum + scene.duration, 0);
	await check('duration', async () => {
		if (!timeline.length)
			return { passed: false, detail: 'the page exposes no scenes in window.__film.scenes' };
		return duration > 0 && duration === total
			? { passed: true, detail: `${duration} s, the sum of ${timeline.length} scene durations` }
			: {
					passed: false,
					detail: `the film reports ${duration} s; its ${timeline.length} scenes add up to ${total} s`
				};
	});

	// Sample the stage every `step` seconds and group the samples into runs of one scene each.
	const times = Array.from({ length: Math.floor(duration / step) + 1 }, (_, index) => index * step);
	if (times.at(-1) < duration) times.push(duration);
	const runs = [];
	await check('scenes', async () => {
		const samples = await page.evaluate(async (sampleTimes) => {
			const found = [];
			for (const time of sampleTimes) {
				await window.__film.seek(time);
				found.push({
					time,
					scene: document.querySelector('[data-stage]')?.dataset.scene ?? '?',
					placeholder: document.body.textContent.includes('Placeholder until')
				});
			}
			return found;
		}, times);
		for (const { time, scene, placeholder } of samples) {
			const run = runs.at(-1);
			if (run?.scene === scene) {
				run.end = time;
				run.placeholder ||= placeholder;
			} else runs.push({ scene, start: time, end: time, placeholder });
		}
		const missing = runs.filter((run) => run.placeholder).map((run) => run.scene);
		const ids = runs.map((run) => run.scene).join(', ');
		const expected = timeline.map((scene) => scene.id).join(', ');
		if (ids !== expected)
			return {
				passed: false,
				detail: `expected ${timeline.length} scenes in order, ${expected}; found ${runs.length}: ${ids}`
			};
		if (missing.length)
			return {
				passed: false,
				detail: `placeholder on stage for ${missing.length} of ${runs.length} scenes: ${missing.join(', ')}`
			};
		return { passed: true, detail: `${runs.length} scenes, each with its own component: ${ids}` };
	});

	// One time in the middle of each scene; reaching each from elsewhere must paint the same pixels.
	await check('determinism', async () => {
		const probes =
			runs.length >= 5
				? runs.map((run) => round((run.start + run.end) / 2))
				: Array.from({ length: 7 }, (_, index) => round(((index + 0.5) * duration) / 7));
		const first = [];
		for (const time of probes) {
			await seek(page, time);
			first.push(await screenshot());
		}
		const differing = [];
		for (const [index, time] of probes.entries()) {
			await seek(page, (time + duration / 2) % duration);
			await seek(page, time);
			const again = await screenshot();
			if (again.equals(first[index])) continue;
			differing.push(time);
			await mkdir(review, { recursive: true });
			await writeFile(join(review, `t-${time.toFixed(2)}-first.png`), first[index]);
			await writeFile(join(review, `t-${time.toFixed(2)}-again.png`), again);
		}
		return differing.length
			? {
					passed: false,
					detail: `frames differ between two seeks at ${list(differing)}; both saved in ${relative(process.cwd(), review) || '.'}`
				}
			: { passed: true, detail: `identical screenshots on a second seek at ${list(probes)}` };
	});

	await check('last frame', async () => {
		await seek(page, duration);
		const share = await inkShare(film.browser, await screenshot());
		return share > 0.001
			? { passed: true, detail: `not blank at ${duration} s (${(share * 100).toFixed(1)}% ink)` }
			: { passed: false, detail: `the frame at ${duration} s is blank` };
	});

	await check('page errors', async () =>
		film.errors.length
			? { passed: false, detail: `${film.errors.length}: ${film.errors.join(' | ')}` }
			: { passed: true, detail: 'none' }
	);
};

let session;
try {
	const server = await serveFilm({ url: values.url, port: Number(values.port) });
	try {
		session = { server, film: await openFilm({ url: server.url }) };
	} catch (error) {
		await server.close();
		throw error;
	}
	report('ready', true, `the film opened at ${server.url}`);
} catch (error) {
	report('ready', false, error.message);
}
if (session)
	try {
		await verify(session.film);
	} finally {
		await session.film.close();
		await session.server.close();
	}
process.exitCode = failures ? 1 : 0;

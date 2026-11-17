import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { stripVTControlCharacters } from 'node:util';

/** The demo-video folder; relative output paths resolve against it. */
export const root = fileURLToPath(new URL('../', import.meta.url));
/** The film's frame size in CSS pixels. */
export const width = 1920;
export const height = 1080;
/** Where `bun run dev` serves the film. */
export const defaultUrl = 'http://localhost:5183';

/**
 * Launches headless Chromium with one 1920×1080 page and opens the film in render mode
 * (`/?render`) at `url`, which must already be served. `scale` is the device pixel ratio,
 * so 0.5 captures 960×540 images of the same frame. `errors` collects uncaught page errors
 * and failed requests.
 */
export const openFilm = async ({ url = defaultUrl, scale = 1 } = {}) => {
	const browser = await chromium.launch();
	try {
		const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
		const errors = [];
		page.on('pageerror', (error) => errors.push(error.message));
		page.on('response', (response) => {
			if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
		});
		const address = new URL('/?render', url).href;
		await page.goto(address, { waitUntil: 'networkidle' }).catch((error) => {
			throw new Error(`Could not open ${address}; is \`bun run dev\` running?\n${error.message}`);
		});
		// On a cold dev server Vite may re-optimize dependencies and reload the page once, so
		// errors from before the film is ready only count when it never becomes ready.
		await page
			.waitForFunction(() => window.__film)
			.catch((error) => {
				throw new Error(`The film never became ready:\n${[...errors, error.message].join('\n')}`);
			});
		errors.length = 0;
		return { browser, page, errors, close: () => browser.close() };
	} catch (error) {
		await browser.close();
		throw error;
	}
};

/** The film's length in seconds, as the open page reports it. */
export const filmDuration = (page) => page.evaluate(() => window.__film.duration);

/** Paints the frame at `time` seconds and resolves once it is ready for a screenshot. */
export const seek = async (page, time) => {
	await page.evaluate((seconds) => window.__film.seek(seconds), time);
	await page.evaluate(() =>
		Promise.all(Array.from(document.images, (image) => image.decode().catch(() => {})))
	);
};

/** Vite's command-line entry, run with this same Node so no other runtime is needed. */
const viteCli = join(
	dirname(createRequire(import.meta.url).resolve('vite/package.json')),
	'bin/vite.js'
);

/** Starts the Vite CLI in the demo-video folder and keeps what it prints for error messages. */
const runVite = (args) => {
	const child = spawn(process.execPath, [viteCli, ...args], {
		cwd: root,
		stdio: ['ignore', 'pipe', 'pipe']
	});
	let printed = '';
	const collect = (data) => {
		printed += data;
	};
	child.stdout.on('data', collect);
	child.stderr.on('data', collect);
	let running = true;
	const exited = new Promise((resolve, reject) => {
		child.once('error', reject);
		child.once('exit', () => {
			running = false;
		});
		child.once('close', (code, signal) => resolve(code ?? signal));
	});
	exited.catch(() => {});
	return {
		child,
		exited,
		running: () => running,
		output: () => stripVTControlCharacters(printed).trim()
	};
};

const answers = (url) =>
	fetch(url).then(
		(response) => response.ok,
		() => false
	);

/**
 * Serves the film and resolves to `{ url, close }`. With `url` it uses the server already
 * running there and starts nothing. Otherwise it builds the app with `vite build` and serves
 * the build with `vite preview` on 127.0.0.1:`port`; `close`, SIGINT and SIGTERM stop it.
 */
export const serveFilm = async ({ url, port }) => {
	if (url) return { url, close: async () => {} };
	const build = runVite(['build']);
	if ((await build.exited) !== 0) throw new Error(`vite build failed:\n${build.output()}`);
	const address = `http://127.0.0.1:${port}`;
	const preview = runVite([
		'preview',
		'--host',
		'127.0.0.1',
		'--port',
		String(port),
		'--strictPort'
	]);
	const interrupt = (signal) => {
		preview.child.kill();
		process.exit(signal === 'SIGTERM' ? 143 : 130);
	};
	process.once('SIGINT', interrupt);
	process.once('SIGTERM', interrupt);
	const close = async () => {
		process.off('SIGINT', interrupt);
		process.off('SIGTERM', interrupt);
		if (preview.running()) preview.child.kill();
		await preview.exited.catch(() => {});
	};
	try {
		// Waiting for this preview to print its own address means a server already on the port
		// is never mistaken for it; --strictPort makes the preview exit instead.
		const deadline = Date.now() + 30_000;
		while (!preview.output().includes(address) || !(await answers(address))) {
			if (!preview.running()) throw new Error(`vite preview stopped:\n${preview.output()}`);
			if (Date.now() > deadline)
				throw new Error(`vite preview did not answer on ${address}:\n${preview.output()}`);
			await sleep(200);
		}
		return { url: address, close };
	} catch (error) {
		await close();
		throw error;
	}
};

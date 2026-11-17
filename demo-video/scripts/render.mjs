// Renders the film to a silent H.264 MP4: every frame seeks the film's clock explicitly, is
// screenshotted, and is piped to FFmpeg. Run `node scripts/render.mjs --help` for the options.
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { rmSync } from 'node:fs';
import { mkdir, rename, rm } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { filmDuration, openFilm, root, seek, serveFilm, width as stageWidth } from './browser.mjs';

const usage = `Usage: node scripts/render.mjs [options]
  --width <px>      frame width, a multiple of 32 from 320 to 3840; height follows 16:9 (1920)
  --fps <n>         frames per second, a whole number from 1 to 60 (30)
  --from <seconds>  film time of the first frame (0)
  --to <seconds>    film time where the render ends (the end of the film)
  --output <path>   MP4 to write, relative to demo-video/ (output/demo.mp4)
  --port <n>        port for the built preview (4175)
  --url <base>      render from a server already running there; builds and starts nothing`;

const parse = () => {
	const { values } = parseArgs({
		// `bun run render -- --fps 12` may pass the separator through.
		args: process.argv.slice(2).filter((arg, index) => index || arg !== '--'),
		options: {
			width: { type: 'string', default: '1920' },
			fps: { type: 'string', default: '30' },
			from: { type: 'string', default: '0' },
			to: { type: 'string' },
			output: { type: 'string', default: 'output/demo.mp4' },
			port: { type: 'string', default: '4175' },
			url: { type: 'string' },
			help: { type: 'boolean', short: 'h' }
		}
	});
	const options = {
		width: Number(values.width),
		fps: Number(values.fps),
		from: Number(values.from),
		to: values.to === undefined ? undefined : Number(values.to),
		output: values.output,
		port: Number(values.port),
		url: values.url,
		help: values.help
	};
	const problems = [];
	// A multiple of 32 keeps both sides of the 16:9 frame whole and even, as yuv420p needs.
	if (
		!Number.isInteger(options.width) ||
		options.width % 32 ||
		options.width < 320 ||
		options.width > 3840
	)
		problems.push('--width must be a multiple of 32 from 320 to 3840, for example 960 or 1280.');
	if (!Number.isInteger(options.fps) || options.fps < 1 || options.fps > 60)
		problems.push('--fps must be a whole number from 1 to 60.');
	if (!Number.isFinite(options.from) || options.from < 0)
		problems.push('--from must be a number of seconds, 0 or more.');
	if (options.to !== undefined && !(options.to > options.from))
		problems.push('--to must be a number of seconds after --from.');
	if (extname(options.output).toLowerCase() !== '.mp4')
		problems.push('--output must name an .mp4 file.');
	if (!Number.isInteger(options.port) || options.port < 1 || options.port > 65535)
		problems.push('--port must be a whole number from 1 to 65535.');
	if (options.url !== undefined && !URL.canParse(options.url))
		problems.push('--url must be a full address, for example http://localhost:5183.');
	if (problems.length) throw new Error(`${problems.join('\n')}\nRun with --help for the options.`);
	return options;
};

/** Fails early unless FFmpeg with libx264 is on the PATH. */
const checkFfmpeg = () => {
	const probe = spawnSync('ffmpeg', ['-hide_banner', '-encoders'], { encoding: 'utf8' });
	if (probe.error?.code === 'ENOENT')
		throw new Error(
			'FFmpeg was not found on the PATH. Install it, for example `brew install ffmpeg`.'
		);
	if (probe.error || probe.status !== 0)
		throw new Error(`FFmpeg could not run: ${probe.error?.message ?? probe.stderr.trim()}`);
	if (!/\blibx264\b/.test(probe.stdout))
		throw new Error('This FFmpeg has no libx264 encoder. Install a build with it.');
};

/**
 * Starts FFmpeg encoding the PNG frames written to it into an H.264 MP4. It writes
 * `<output>.part` and renames it to `output` once finished, so a failed or interrupted render
 * never leaves a broken video behind or replaces a good one.
 */
const encoder = (output, { width, height, fps }) => {
	const partial = `${output}.part`;
	const ffmpeg = spawn(
		'ffmpeg',
		[
			...['-hide_banner', '-loglevel', 'error', '-y'],
			...['-f', 'image2pipe', '-c:v', 'png', '-framerate', String(fps), '-i', 'pipe:0'],
			'-an',
			// Frames are sRGB screenshots: convert them with the BT.709 matrix HD players assume and
			// tag the frames with it, since FFmpeg takes the stream's color tags from the frames.
			'-vf',
			[
				`scale=${width}:${height}:out_color_matrix=bt709:out_range=tv`,
				'format=yuv420p',
				'setparams=colorspace=bt709:color_primaries=bt709:color_trc=bt709:range=tv'
			].join(','),
			...['-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p'],
			...['-movflags', '+faststart', '-f', 'mp4', partial]
		],
		{ stdio: ['pipe', 'ignore', 'pipe'] }
	);
	let log = '';
	ffmpeg.stderr.on('data', (data) => {
		log += data;
	});
	ffmpeg.stdin.on('error', () => {});
	const finished = new Promise((resolve, reject) => {
		ffmpeg.once('error', reject);
		ffmpeg.once('close', (code) =>
			code === 0 ? resolve() : reject(new Error(`FFmpeg failed: ${log.trim() || `exit ${code}`}`))
		);
	});
	// Handled at once so an early FFmpeg failure is never an unhandled rejection.
	finished.catch(() => {});
	// SIGINT and SIGTERM exit without unwinding, so the exit itself discards the partial file.
	const discard = () => {
		ffmpeg.kill('SIGKILL');
		rmSync(partial, { force: true });
	};
	process.once('exit', discard);
	return {
		write: async (image) => {
			if (ffmpeg.exitCode !== null) return finished;
			if (!ffmpeg.stdin.write(image))
				await Promise.race([once(ffmpeg.stdin, 'drain').catch(() => finished), finished]);
		},
		finish: async () => {
			ffmpeg.stdin.end();
			await finished;
			await rename(partial, output);
			process.off('exit', discard);
		},
		abort: async () => {
			ffmpeg.kill('SIGKILL');
			await finished.catch(() => {});
			await rm(partial, { force: true });
			process.off('exit', discard);
		}
	};
};

const formatSeconds = (milliseconds) => `${(milliseconds / 1000).toFixed(1)} s`;

/** Seeks, screenshots and encodes every frame from `from` to `to` into `output`. */
const render = async (film, { width, fps, from, to: end }, output) => {
	const duration = await filmDuration(film.page);
	const to = end ?? duration;
	if (from >= duration)
		throw new Error(`--from ${from} is not before the film's end at ${duration} s.`);
	if (to > duration) throw new Error(`--to ${to} is past the film's end at ${duration} s.`);
	const frames = Math.round((to - from) * fps);
	if (!frames) throw new Error(`${from}–${to} s is shorter than one frame at ${fps} fps.`);
	const height = (width * 9) / 16;
	console.log(`Rendering ${from}–${to} s: ${frames} frames at ${width}×${height}, ${fps} fps`);
	const video = encoder(output, { width, height, fps });
	const started = performance.now();
	try {
		for (let frame = 0; frame < frames; frame++) {
			const time = from + frame / fps;
			await seek(film.page, time).catch((error) => {
				const reason = error.message.split('\n')[0];
				throw new Error(
					`Seeking to ${time.toFixed(2)} s failed (a dev server reloads the page when a file changes): ${reason}`
				);
			});
			const image = await film.page.screenshot({ animations: 'disabled' });
			if (film.errors.length)
				throw new Error(
					`The page reported errors by ${time.toFixed(2)} s:\n${film.errors.join('\n')}`
				);
			await video.write(image);
			if (frame % fps === 0)
				console.log(
					`  ${time.toFixed(1)} s · ${Math.round((frame / frames) * 100)}% · ${formatSeconds(performance.now() - started)}`
				);
		}
		await video.finish();
	} catch (error) {
		await video.abort();
		throw error;
	}
	console.log(
		`Saved ${output} · ${frames} frames · ${(frames / fps).toFixed(2)} s · rendered in ${formatSeconds(performance.now() - started)}`
	);
};

const main = async () => {
	const options = parse();
	if (options.help) return console.log(usage);
	checkFfmpeg();
	const output = resolve(root, options.output);
	await mkdir(dirname(output), { recursive: true });
	console.log(
		options.url
			? `Using the film at ${options.url}`
			: `Building the film and previewing it on port ${options.port}`
	);
	const server = await serveFilm({ url: options.url, port: options.port });
	try {
		const film = await openFilm({ url: server.url, scale: options.width / stageWidth });
		try {
			await render(film, options, output);
		} finally {
			await film.close();
		}
	} finally {
		await server.close();
	}
};

await main().catch((error) => {
	const hint = error.code?.startsWith('ERR_PARSE_ARGS') ? '\nRun with --help for the options.' : '';
	console.error(`Render failed: ${error.message}${hint}`);
	process.exitCode = 1;
});

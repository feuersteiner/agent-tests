// Every scene has an explicit duration; any frame is a pure function of the film's time.
export const scenes = [
	{ id: 'hook', label: 'The same mistake, again', duration: 3.5 },
	{ id: 'rule', label: 'Write the rule', duration: 5 },
	{ id: 'compile', label: 'Your agent compiles it', duration: 7 },
	{ id: 'eval', label: 'Prove it on evals', duration: 6 },
	{ id: 'commit', label: 'Run it on every commit', duration: 8.5 },
	{ id: 'funnel', label: 'Cheap first', duration: 5 },
	{ id: 'cta', label: 'Your turn', duration: 5 }
] as const;
export type Scene = (typeof scenes)[number];
export type SceneId = Scene['id'];

/** The film's total length in seconds. */
export const duration = scenes.reduce((sum, scene) => sum + scene.duration, 0);
/** The film time at which each scene begins, by scene index. */
export const starts = scenes.map((_, index) =>
	scenes.slice(0, index).reduce((sum, scene) => sum + scene.duration, 0)
);

export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
/** Cubic ease-out over 0..1. */
export const ease = (value: number) => 1 - (1 - clamp(value)) ** 3;
/** Quintic ease-in-out over 0..1, with zero velocity and acceleration at both ends. */
export const smooth = (value: number) => {
	const p = clamp(value);
	return p * p * p * (p * (p * 6 - 15) + 10);
};

/** The scene playing at `seconds`, its index, and the seconds since it began. */
export const locate = (seconds: number) => {
	const index = Math.max(
		starts.findLastIndex((start) => start <= seconds),
		0
	);
	const scene = scenes[index];
	return { scene, index, time: clamp(seconds - starts[index], 0, scene.duration) };
};

/** The first `progress` (0..1) share of `source`, counted in characters. */
export const typeChars = (source: string, progress: number) => {
	const characters = Array.from(source);
	return characters.slice(0, Math.floor(clamp(progress) * characters.length)).join('');
};

/** Formats seconds as m:ss.s, for example 0:12.5. */
export const formatTime = (seconds: number) => {
	const tenths = Math.floor(Math.max(seconds, 0) * 10);
	const minutes = Math.floor(tenths / 600);
	const rest = (tenths % 600) / 10;
	return `${minutes}:${rest.toFixed(1).padStart(4, '0')}`;
};

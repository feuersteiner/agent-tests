<script lang="ts">
	import { Pill, Surface } from 'bref-ui';
	import Caption from '../components/caption.svelte';
	import { fade, progress } from '../motion.js';
	import { scenes, smooth } from '../timeline.js';

	let { time }: { time: number } = $props();

	const duration = scenes.find((scene) => scene.id === 'funnel')!.duration;

	// Layout in stage pixels: two panels, two stage columns of 360 px in each.
	const columnWidth = 360;
	const columns = [136, 536, 1024, 1424];
	/** The band's center line. */
	const axis = 572;
	/** One dot is one file; dots sit on a 17 px grid in every stage so clusters compare honestly. */
	const pitch = 17;
	const radius = 6;
	/** Room between a cluster and the band around it, per stage. */
	const pads = [18, 14, 9];

	const groups = [
		{ label: 'Local · free', icon: 'computer', color: 'success', left: 96 },
		{ label: 'Model calls', icon: 'neurology', color: 'warning', left: 984 }
	] as const;

	// Illustrative counts for one run over a mid-sized repository, not a measurement.
	// `count` is how many files reach the stage; `across` is how many dots one row of its cluster holds.
	const stages = [
		{ name: 'glob', note: 'matches the path', count: 240, across: 20, at: 0.6 },
		{ name: 'grep', note: 'reads for suspect text', count: 12, across: 6, at: 1.2 },
		{ name: 'decide', note: 'fast model, yes or no', count: 2, across: 2, at: 1.8 },
		{ name: 'reason', note: 'slow model, last resort', count: 0, across: 1, at: 2.4 }
	];

	/** The files each stage passes on, by index in its cluster: twelve scattered routes, then two with suspect text, then none. */
	const passed = [
		[3, 14, 8, 17, 1, 11, 6, 19, 12, 4, 15, 9].map((column, row) => row * 20 + column),
		[3, 8],
		[] as number[]
	];
	/** When a stage has looked: the files it clears dim, and the ones it passes on leave for the next stage. */
	const settles = stages.map((stage) => stage.at + 0.4);

	const rowsOf = (stage: number) => Math.ceil(stages[stage].count / stages[stage].across);
	/** Half the width of the band where it holds a stage's cluster. */
	const reach = (stage: number) => ((stages[stage].across - 1) / 2) * pitch + radius + pads[stage];
	// The glob band starts on the text's left edge; the smaller clusters sit centered in their columns.
	const centers = [
		columns[0] + reach(0),
		columns[1] + columnWidth / 2,
		columns[2] + columnWidth / 2
	];
	const place = (stage: number, index: number) => ({
		x: centers[stage] + ((index % stages[stage].across) - (stages[stage].across - 1) / 2) * pitch,
		y: axis + (Math.floor(index / stages[stage].across) - (rowsOf(stage) - 1) / 2) * pitch
	});

	const globDots = Array.from({ length: stages[0].count }, (_, index) => ({
		index,
		...place(0, index),
		kept: passed[0].includes(index)
	}));
	/** Files travelling on: each starts on a dot that passed and lands in the next stage's cluster. */
	const movers = [0, 1].flatMap((stage) =>
		passed[stage].map((source, slot) => ({
			key: `${stage + 1}-${slot}`,
			stage: stage + 1,
			from: place(stage, source),
			to: place(stage + 1, slot),
			start: settles[stage],
			end: stages[stage + 1].at + 0.2,
			kept: passed[stage + 1].includes(slot)
		}))
	);

	// The band wraps each cluster and tapers between them, ending in a point where `reason` begins.
	const holds = centers.map((center, stage) => ({
		left: center - reach(stage),
		right: center + reach(stage),
		half: ((rowsOf(stage) - 1) / 2) * pitch + radius + pads[stage]
	}));
	const [first, second, third] = holds;
	const tip = columns[3];
	const end = columns[3] + columnWidth;
	const corner = 18;
	/** A cubic from one point to another with level tangents at both ends. */
	const curve = (x1: number, y1: number, x2: number, y2: number) =>
		`C ${(x1 + x2) / 2} ${y1} ${(x1 + x2) / 2} ${y2} ${x2} ${y2}`;
	const band = [
		`M ${first.left + corner} ${axis - first.half}`,
		`H ${first.right}`,
		curve(first.right, axis - first.half, second.left, axis - second.half),
		`H ${second.right}`,
		curve(second.right, axis - second.half, third.left, axis - third.half),
		`H ${third.right}`,
		curve(third.right, axis - third.half, tip, axis),
		curve(tip, axis, third.right, axis + third.half),
		`H ${third.left}`,
		curve(third.left, axis + third.half, second.right, axis + second.half),
		`H ${second.left}`,
		curve(second.left, axis + second.half, first.right, axis + first.half),
		`H ${first.left + corner}`,
		`Q ${first.left} ${axis + first.half} ${first.left} ${axis + first.half - corner}`,
		`V ${axis - first.half + corner}`,
		`Q ${first.left} ${axis - first.half} ${first.left + corner} ${axis - first.half}`,
		'Z'
	].join(' ');
	/** The band is revealed left to right, one stretch per stage, as the files travel. */
	const sweeps = [
		{ from: first.left, to: first.right, start: 0.5, end: 0.85 },
		{ from: first.right, to: second.right, start: settles[0], end: stages[1].at + 0.25 },
		{ from: second.right, to: third.right, start: settles[1], end: stages[2].at + 0.25 },
		{ from: third.right, to: tip, start: settles[2], end: stages[3].at + 0.15 }
	];

	const entered = $derived(fade(time, 0, 0.4));
	const exit = $derived(1 - fade(time, duration - 0.3, duration));
	const reveal = $derived(
		sweeps.reduce(
			(x, sweep) => x + (sweep.to - sweep.from) * fade(time, sweep.start, sweep.end),
			first.left
		)
	);
	const empty = $derived(fade(time, stages[3].at, stages[3].at + 0.35));
	const point = $derived(fade(time, 3.1, 3.5));

	/** 1 until `from`, then down to a faint trace: the stage has settled that file. */
	const dim = (from: number) => 1 - 0.65 * fade(time, from, from + 0.2);
</script>

<!-- Cheap first: four stages narrow the files, and only what is left reaches a model. -->
<div class="caption" style:opacity={exit}>
	<Caption text="Cheap first" {time} />
</div>

<div class="scene" style:opacity={entered * exit} style:translate={`0 ${(1 - entered) * 24}px`}>
	{#each groups as group (group.label)}
		<div class="panel" style:left={`${group.left}px`}>
			<Surface
				color={group.color}
				variant="soft"
				radius="large"
				height="fill"
				style="--surface-soft-strength: 9%"
			/>
		</div>
		<div class="group" style:left={`${group.left + 40}px`}>
			<span class="pill">
				<Pill
					label={group.label}
					icon={{ name: group.icon }}
					color={group.color}
					variant="soft"
					size="large"
				/>
			</span>
		</div>
	{/each}

	<svg viewBox="0 0 1920 1080" aria-hidden="true">
		<defs>
			<clipPath id="funnel-reveal">
				<rect x={first.left - 2} y="0" width={reveal - first.left + 2} height="1080" />
			</clipPath>
		</defs>
		{#if reveal > first.left}
			<path d={band} clip-path="url(#funnel-reveal)" />
		{/if}
		{#if empty > 0}
			<line x1={tip + 24} y1={axis} x2={tip + 24 + (end - tip - 24) * empty} y2={axis} />
		{/if}
		{#each globDots as dot (dot.index)}
			{@const wave = (dot.index % stages[0].across) * 0.015}
			<circle
				cx={dot.x}
				cy={dot.y}
				r={radius}
				opacity={fade(time, 0.55 + wave, 0.7 + wave) * (dot.kept ? 1 : dim(settles[0]))}
			/>
		{/each}
		{#each movers as mover (mover.key)}
			{@const travel = smooth(progress(time, mover.start, mover.end))}
			{#if time >= mover.start}
				<circle
					cx={mover.from.x + (mover.to.x - mover.from.x) * travel}
					cy={mover.from.y + (mover.to.y - mover.from.y) * travel}
					r={radius}
					opacity={mover.kept ? 1 : dim(settles[mover.stage])}
				/>
			{/if}
		{/each}
	</svg>

	{#each stages as stage, index (stage.name)}
		{@const filled = fade(time, stage.at - 0.05, stage.at + 0.25)}
		{@const counted = fade(time, stage.at + 0.1, stage.at + 0.4)}
		<div class="stage" style:left={`${columns[index]}px`}>
			<h3>{stage.name}</h3>
			<p class="note" style:opacity={filled} style:translate={`0 ${(1 - filled) * 12}px`}>
				{stage.note}
			</p>
		</div>
		<div class="count" style:left={`${columns[index]}px`} style:opacity={counted}>
			<span class="number">{stage.count}</span>
			<span class="unit">files</span>
		</div>
	{/each}

	<p class="point" style:opacity={point} style:translate={`0 ${(1 - point) * 24}px`}>
		Most files never reach a model.
	</p>
	<p class="footnote" style:opacity={fade(time, stages[0].at + 0.1, stages[0].at + 0.4)}>
		Illustrative counts.
	</p>
</div>

<style>
	.caption,
	.scene {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}
	.panel {
		position: absolute;
		top: 200px;
		width: 840px;
		height: 628px;
	}
	.group {
		position: absolute;
		top: 232px;
	}
	.pill {
		display: flex;
		zoom: 1.5;
		font-size: 18px;
		font-weight: 600;
	}
	svg {
		position: absolute;
		inset: 0;
		width: 1920px;
		height: 1080px;
	}
	path {
		fill: color-mix(in srgb, var(--color-primary) 10%, transparent);
		stroke: color-mix(in srgb, var(--color-primary) 32%, transparent);
		stroke-width: 2;
	}
	line {
		stroke: var(--color-muted);
		stroke-width: 3;
		stroke-dasharray: 1 12;
		stroke-linecap: round;
		opacity: 0.7;
	}
	circle {
		fill: var(--color-primary);
	}
	.stage {
		position: absolute;
		top: 318px;
		width: 360px;
	}
	h3 {
		margin: 0;
		font:
			600 52px / 1.1 var(--font-mono),
			monospace;
		letter-spacing: -0.02em;
	}
	.note {
		margin: 8px 0 0;
		font-size: 28px;
		line-height: 1.3;
		color: var(--color-muted);
		white-space: nowrap;
	}
	.count {
		position: absolute;
		top: 718px;
		display: flex;
		align-items: baseline;
		gap: 12px;
	}
	.number {
		font:
			650 64px / 1 var(--font-text),
			sans-serif;
		letter-spacing: -0.03em;
		font-variant-numeric: tabular-nums;
	}
	.unit {
		font-size: 28px;
		color: var(--color-muted);
	}
	.point {
		position: absolute;
		top: 872px;
		left: 0;
		width: 1920px;
		margin: 0;
		font:
			650 56px / 1.1 var(--font-text),
			sans-serif;
		letter-spacing: -0.03em;
		text-align: center;
	}
	.footnote {
		position: absolute;
		right: 96px;
		bottom: 72px;
		margin: 0;
		font-size: 24px;
		color: var(--color-muted);
	}
</style>

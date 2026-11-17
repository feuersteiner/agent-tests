<script lang="ts">
	import { Icon, Pill, Surface } from 'bref-ui';
	import { Surface as CodeSurface, Theme } from 'bref-ui-themes/vscode';
	import Caption from '../components/caption.svelte';
	import Terminal from '../components/terminal.svelte';
	import type { TerminalLine } from '../components/terminal.svelte';
	import { fade } from '../motion.js';
	import { product } from '../product.js';
	import { scenes } from '../timeline.js';

	let { time }: { time: number } = $props();

	const duration = scenes.find((scene) => scene.id === 'compile')!.duration;

	// Beat A, 0.4 to 3.4: alone on stage, the command types, the first real lines of its prompt
	// print, then the tag; from 1.8 nothing moves, so the tag can be read.
	const command = `${product.command} compile brand-voice`;
	const lines: TerminalLine[] = [
		{ at: 0.4, text: command, kind: 'command', typed: 0.7 },
		...[`# Compile the ${product.name} Test \`brand-voice\``, '## The rule', '## Steps'].map(
			(text) => ({ at: 1.25, text })
		)
	];

	// Beat B, 3.4 to 4.4: the terminal shrinks into a dim chip under the caption, and the hand-off
	// leads from it to the coding agent, then branches down to where the three cards will land.
	// Both boxes match their rules in the style block.
	const terminal = { left: 360, top: 320, width: 1200, height: 436 };
	const chip = { left: 96, top: 208, width: 542, height: 64 };
	const shrinkTo = chip.width / terminal.width;
	const shiftX = chip.left + chip.width / 2 - (terminal.left + terminal.width / 2);
	const shiftY = chip.top + chip.height / 2 - (terminal.top + terminal.height / 2);

	/** The hand-off row's center line, and the agent's node on the stage's center column. */
	const row = chip.top + chip.height / 2;
	const node = { x: 960, radius: 36 };
	const wireFrom = chip.left + chip.width + 16;
	const wireTo = node.x - node.radius - 12;
	const gap = 32;
	const cardWidth = (1920 - 2 * 96 - 2 * gap) / 3;
	const cardsTop = 344;
	const bar = 300;
	const corner = 16;
	const tip = cardsTop - 14;
	/** The center of each card, where its branch ends. */
	const centers = [0, 1, 2].map((index) => 96 + cardWidth / 2 + index * (cardWidth + gap));
	const branches = centers.map((x, index) => {
		if (index === 1) return `M ${node.x} ${row + node.radius} V ${tip}`;
		const side = Math.sign(x - node.x);
		return [
			`M ${node.x} ${row + node.radius}`,
			`V ${bar - corner}`,
			`Q ${node.x} ${bar} ${node.x + side * corner} ${bar}`,
			`H ${x - side * corner}`,
			`Q ${x} ${bar} ${x} ${bar + corner}`,
			`V ${tip}`
		].join(' ');
	});
	const chevron = (x: number, y: number, dx: number, dy: number) =>
		`${x - dx - dy},${y - dy + dx} ${x},${y} ${x - dx + dy},${y - dy - dx}`;

	// Beat C, 4.4 to 8.0: one card per assertion of brand-voice/test.yaml, 1.2 s apart.
	// Long patterns are cut with a trailing … after a meaningful prefix; the questions are exact.
	const assertions = [
		{
			id: 'no-hype',
			grep: '[Rr]evolutionary|…',
			decide: 'The text makes no superlative claim about the product.'
		},
		{
			id: 'no-guarantees',
			grep: '[Gg]uarantee|100%|…',
			decide: 'The text makes no promise of a result.'
		},
		{
			id: 'no-blame',
			grep: '[Yy]ou (entered|failed|…',
			decide: 'The text does not blame the reader for a problem.'
		}
	];
	const cardAt = (index: number) => 4.4 + index * 1.2;

	const enter = $derived(fade(time, 0, 0.4));
	const exit = $derived(1 - fade(time, duration - 0.3, duration));
	const tagIn = $derived(fade(time, 1.5, 1.8));
	const tag = $derived(tagIn * (1 - fade(time, 3.4, 3.55)));
	// Each step of the hand-off starts as the one before it settles: shrink, chip, wire, agent, branches.
	const shrink = $derived(fade(time, 3.4, 3.75));
	const shown = $derived(enter * (1 - fade(time, 3.5, 3.75)));
	const landed = $derived(fade(time, 3.58, 3.78));
	const wire = $derived(fade(time, 3.74, 3.92));
	const agent = $derived(fade(time, 3.9, 4.08));
	const tree = $derived(fade(time, 4.06, 4.32));
	const tips = $derived(fade(time, 4.28, 4.38));
	// Beat D: settled by 8.2 and completely still until the exit at 10.7.
	const closing = $derived(fade(time, 7.9, 8.2));
	const rise = (amount: number) => `0 ${(1 - amount) * 24}px`;
</script>

<div class="scene" style:opacity={exit}>
	<Caption step={2} text="Your agent compiles it" {time} />

	<svg viewBox="0 0 1920 1080" aria-hidden="true">
		{#if wire > 0}
			<path
				d={`M ${wireFrom} ${row} H ${wireTo}`}
				pathLength="1"
				stroke-dasharray="1"
				stroke-dashoffset={1 - wire}
			/>
			<polyline points={chevron(wireTo, row, 11, 0)} style:opacity={fade(time, 3.86, 3.92)} />
		{/if}
		{#if tree > 0}
			{#each branches as branch (branch)}
				<path d={branch} pathLength="1" stroke-dasharray="1" stroke-dashoffset={1 - tree} />
			{/each}
			{#each centers as x (x)}
				<polyline points={chevron(x, tip, 0, 11)} style:opacity={tips} />
			{/each}
		{/if}
	</svg>

	<div
		class="terminal"
		style:opacity={shown}
		style:translate={`${shiftX * shrink}px ${shiftY * shrink + (1 - enter) * 24}px`}
		style:scale={1 - (1 - shrinkTo) * shrink}
	>
		<Terminal --code-size="44px" {lines} {time} />
	</div>

	<div class="note" style:opacity={tag} style:translate={rise(tagIn)}>
		<span class="tag">
			<Pill label="prints a prompt · calls no model" color="primary" variant="filled" />
		</span>
	</div>

	<div class="chip" style:opacity={0.55 * landed}>
		<Theme>
			<CodeSurface
				orientation="horizontal"
				height="fill"
				radius="1rem"
				shadow="medium"
				color="background"
				variant="filled"
			>
				<span class="dollar">$</span>
				<code class="command">{command}</code>
			</CodeSurface>
		</Theme>
	</div>

	<div class="node" style:opacity={agent} style:scale={0.6 + 0.4 * agent}>
		<Icon name="smart_toy" filled />
	</div>
	<span class="agent" style:opacity={agent} style:translate={`${(1 - agent) * -16}px 0`}>
		your coding agent
	</span>

	<div class="cards">
		{#each assertions as assertion, index (assertion.id)}
			{@const arrived = fade(time, cardAt(index), cardAt(index) + 0.3)}
			<div class="card" style:opacity={arrived} style:translate={rise(arrived)}>
				<Surface color="background" variant="filled" shadow="medium" radius="1.5rem" height="fill">
					<h3>{assertion.id}</h3>
					<div class="check">
						<span class="tag">
							<Pill label="text check · local · free" color="success" variant="soft" />
						</span>
						<code class="pattern">{assertion.grep}</code>
					</div>
					<div class="check">
						<span class="tag">
							<Pill label="if it matches: one yes-or-no question" color="primary" variant="soft" />
						</span>
						<p class="question">{assertion.decide}</p>
					</div>
				</Surface>
			</div>
		{/each}
	</div>

	<p class="closing" style:opacity={closing} style:translate={rise(closing)}>
		<span>One fuzzy rule.</span>
		<span class="accent">Three clear questions.</span>
	</p>
</div>

<style>
	.scene {
		position: absolute;
		inset: 0;
	}
	svg {
		position: absolute;
		inset: 0;
		width: 1920px;
		height: 1080px;
		overflow: visible;
	}
	path,
	polyline {
		fill: none;
		stroke: var(--color-primary);
		stroke-width: 4;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.terminal {
		position: absolute;
		top: 320px;
		left: 360px;
		width: 1200px;
		height: 436px;
	}
	.note {
		position: absolute;
		top: 800px;
		left: 0;
		display: flex;
		justify-content: center;
		width: 1920px;
		--tag-zoom: 2;
	}
	/* Pills are sized in rem; zoom scales the whole pill so it reads at film size. */
	.tag {
		display: flex;
		zoom: var(--tag-zoom, 1.5);
		font-size: 18px;
		font-weight: 600;
	}
	.chip {
		position: absolute;
		top: 208px;
		left: 96px;
		width: 542px;
		height: 64px;
	}
	.chip > :global([data-bref-theme]) {
		height: 100%;
		min-height: 0;
		background: transparent;
		font:
			400 24px / 1.5 var(--font-mono),
			monospace;
	}
	.chip :global([data-surface]) {
		gap: 0.6em;
		padding: 0 1em;
	}
	.dollar {
		color: var(--color-success);
	}
	.command {
		font: inherit;
		color: #e4e4e4;
		white-space: pre;
	}
	.node {
		position: absolute;
		top: 204px;
		left: 924px;
		display: grid;
		place-items: center;
		width: 72px;
		height: 72px;
		border-radius: 50%;
		background: var(--color-primary);
		color: var(--color-background);
		font-size: 44px;
	}
	.agent {
		position: absolute;
		top: 219px;
		left: 1016px;
		color: var(--color-primary);
		font:
			600 34px / 1.2 var(--font-text),
			sans-serif;
		letter-spacing: -0.02em;
		white-space: nowrap;
	}
	.cards {
		position: absolute;
		top: 344px;
		left: 96px;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 32px;
		width: 1728px;
		/* 26px tag text: the longest tag fits the card's width on one line. */
		--tag-zoom: 1.44;
	}
	.card {
		min-width: 0;
	}
	/* The card tags take less side padding and never wrap, so the longer second tag stays on one line. */
	.card .tag :global([data-variant]) {
		--pill-padding: 0.5rem;
		white-space: nowrap;
	}
	.card :global([data-surface]) {
		--surface-fill: color-mix(in srgb, white 72%, var(--color-background));
		gap: 26px;
		padding: 34px 36px 40px;
	}
	h3 {
		margin: 0;
		font:
			700 36px / 1.2 var(--font-mono),
			monospace;
		letter-spacing: -0.02em;
	}
	.check {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 12px;
	}
	.pattern {
		white-space: nowrap;
		color: color-mix(in srgb, var(--color-foreground) 75%, var(--color-background));
		font:
			500 30px / 1.35 var(--font-mono),
			monospace;
	}
	.question {
		margin: 0;
		font:
			600 48px / 1.14 var(--font-text),
			sans-serif;
		letter-spacing: -0.025em;
		text-wrap: pretty;
	}
	.closing {
		position: absolute;
		top: 896px;
		left: 96px;
		display: flex;
		gap: 0.26em;
		margin: 0;
		font:
			650 64px / 1.1 var(--font-text),
			sans-serif;
		letter-spacing: -0.035em;
		white-space: nowrap;
	}
	.accent {
		color: var(--color-primary);
	}
</style>

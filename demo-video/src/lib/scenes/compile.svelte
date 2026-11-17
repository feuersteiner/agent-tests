<script lang="ts">
	import { Icon, Pill, Surface } from 'bref-ui';
	import Caption from '../components/caption.svelte';
	import Terminal from '../components/terminal.svelte';
	import type { TerminalLine } from '../components/terminal.svelte';
	import { fade, progress } from '../motion.js';
	import { product } from '../product.js';
	import { scenes } from '../timeline.js';

	let { time }: { time: number } = $props();

	const duration = scenes.find((scene) => scene.id === 'compile')!.duration;

	// The command types out, then the first real lines of the prompt print one after another.
	const lines: TerminalLine[] = [
		{
			at: 0.4,
			text: `${product.command} compile errors-hide-internals`,
			kind: 'command',
			typed: 1.1
		},
		...[
			`# Compile the ${product.name} Test \`errors-hide-internals\``,
			'## The rule',
			'## Steps',
			'## test.yaml',
			'## How a Test runs',
			'## One thing per criterion',
			'## Example'
		].map((text, index) => ({ at: 1.6 + index * 0.12, text }))
	];

	// The four assertions of test.yaml; long patterns are cut after a meaningful prefix.
	const assertions = [
		{ id: 'no-stack-trace', grep: '[Ss]tack', decide: 'No response includes a stack trace.' },
		{
			id: 'no-sql',
			grep: 'SQL|[Ss]ql|[Qq]uery|SELECT|…',
			decide: 'No response includes an SQL query.'
		},
		{
			id: 'no-file-path',
			grep: '__dirname|__filename|[Pp]ath|…',
			decide: 'No response includes a server file path.'
		},
		{
			id: 'no-internal-host',
			grep: '[Hh]ost|\\.internal|…',
			decide: 'No response names an internal host or address.'
		}
	].map((assertion, index) => ({ ...assertion, at: 3 + index * 0.55 }));

	const exit = $derived(1 - fade(time, duration - 0.3, duration));
	const enter = $derived(fade(time, 0, 0.4));
	// Once every card is in, the prompt side steps back so the result and the summary lead.
	const dim = $derived(1 - 0.3 * fade(time, 5.1, 5.5));
	const note = $derived(fade(time, 1.9, 2.3));
	const wireIn = $derived(progress(time, 2.5, 2.65));
	const node = $derived(fade(time, 2.58, 2.8));
	const wireOut = $derived(progress(time, 2.72, 2.9));
	const head = $derived(fade(time, 2.85, 2.95));
	const file = $derived(fade(time, 2.85, 3.15));
	const broad = $derived(fade(time, 5.25, 5.55));
	const narrow = $derived(fade(time, 5.35, 5.65));
	const rise = (shown: number) => `0 ${(1 - shown) * 24}px`;
</script>

<div class="scene" style:opacity={exit}>
	<Caption step={2} text="Your agent compiles it" {time} />

	<!-- Dimmed as one layer, so the label on the terminal keeps covering it while both fade. -->
	<div class="prompt" style:opacity={dim}>
		<div class="terminal" style:opacity={enter} style:translate={rise(enter)}>
			<Terminal --code-size="21px" {lines} {time} />
		</div>

		<div class="note" style:opacity={note} style:translate={rise(note)}>
			<span class="tag">
				<Pill label="prints a prompt · calls no model" color="primary" variant="filled" />
			</span>
		</div>

		<div class="handoff">
			<svg viewBox="0 0 188 72" aria-hidden="true">
				<path d="M 10 36 H 56" stroke-dasharray="46" stroke-dashoffset={46 * (1 - wireIn)} />
				<path d="M 132 36 H 174" stroke-dasharray="42" stroke-dashoffset={42 * (1 - wireOut)} />
				<polyline points="164,26 175,36 164,46" style:opacity={head} />
			</svg>
			<div class="node" style:opacity={node} style:scale={0.6 + 0.4 * node}>
				<Icon name="smart_toy" filled />
			</div>
			<span class="agent" style:opacity={node}>your coding agent</span>
		</div>
	</div>

	<header style:opacity={file} style:translate={rise(file)}>
		<strong>test.yaml</strong>
		<code class="glob">glob: 'src/routes/**/*.ts'</code>
	</header>

	<div class="cards">
		{#each assertions as assertion (assertion.id)}
			{@const shown = fade(time, assertion.at, assertion.at + 0.3)}
			<div class="card" style:opacity={shown} style:translate={rise(shown)}>
				<Surface color="background" variant="filled" shadow="medium" radius="1.5rem" height="fill">
					<h3>{assertion.id}</h3>
					<div class="check">
						<span class="tag">
							<Pill label="grep · local" color="muted" variant="soft" />
						</span>
						<code class="pattern">{assertion.grep}</code>
					</div>
					<div class="check">
						<span class="tag">
							<Pill label="decide · one yes/no question" color="primary" variant="soft" />
						</span>
						<p class="decide">{assertion.decide}</p>
					</div>
				</Surface>
			</div>
		{/each}
	</div>

	<p class="summary">
		<span class="broad" style:opacity={broad} style:translate={rise(broad)}>One broad rule.</span>
		<span class="narrow" style:opacity={narrow} style:translate={rise(narrow)}>
			Four narrow checks.
		</span>
	</p>
</div>

<style>
	.scene,
	.prompt {
		position: absolute;
		inset: 0;
	}
	.terminal {
		position: absolute;
		top: 200px;
		left: 96px;
		width: 620px;
		height: 420px;
	}
	.note {
		position: absolute;
		/* Straddles the terminal's bottom edge, so it reads as a label on the terminal. */
		top: 596px;
		left: 124px;
		--tag-zoom: 1.5;
	}
	.handoff {
		position: absolute;
		top: 374px;
		left: 716px;
		width: 188px;
	}
	svg {
		display: block;
		width: 188px;
		height: 72px;
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
	.node {
		position: absolute;
		top: 2px;
		left: 60px;
		display: grid;
		place-items: center;
		width: 68px;
		height: 68px;
		border-radius: 50%;
		background: var(--color-primary);
		color: var(--color-background);
		font-size: 40px;
	}
	.agent {
		display: block;
		margin: 14px auto 0;
		width: 150px;
		color: var(--color-primary);
		font:
			600 22px / 1.2 var(--font-text),
			sans-serif;
		text-align: center;
	}
	header {
		position: absolute;
		top: 200px;
		left: 904px;
		display: flex;
		align-items: baseline;
		gap: 24px;
		height: 48px;
	}
	strong {
		font:
			700 32px / 1.4 var(--font-mono),
			monospace;
		letter-spacing: -0.02em;
	}
	.glob {
		color: var(--color-muted);
		font:
			400 24px / 1.4 var(--font-mono),
			monospace;
	}
	.cards {
		position: absolute;
		top: 268px;
		left: 904px;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		grid-template-rows: repeat(2, 1fr);
		gap: 24px;
		width: 920px;
		height: 740px;
	}
	.card {
		min-width: 0;
		min-height: 0;
	}
	.card :global([data-surface]) {
		--surface-fill: color-mix(in srgb, white 72%, var(--color-background));
		gap: 22px;
		padding: 26px 26px 28px;
	}
	h3 {
		margin: 0;
		font:
			700 30px / 1.2 var(--font-mono),
			monospace;
		letter-spacing: -0.02em;
	}
	.check {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 10px;
	}
	/* Pills are sized in rem; zoom scales the whole pill so it reads at film size. */
	.tag {
		display: flex;
		zoom: var(--tag-zoom, 1.2);
		font-size: 17px;
		font-weight: 600;
	}
	.pattern {
		white-space: nowrap;
		color: color-mix(in srgb, var(--color-foreground) 78%, var(--color-background));
		font:
			500 22px / 1.4 var(--font-mono),
			monospace;
	}
	.decide {
		margin: 0;
		font:
			560 32px / 1.25 var(--font-text),
			sans-serif;
		letter-spacing: -0.02em;
	}
	.summary {
		position: absolute;
		bottom: 72px;
		left: 96px;
		width: 620px;
		margin: 0;
		font:
			650 56px / 1.12 var(--font-text),
			sans-serif;
		letter-spacing: -0.035em;
	}
	.broad,
	.narrow {
		display: block;
	}
	.narrow {
		color: var(--color-primary);
	}
</style>

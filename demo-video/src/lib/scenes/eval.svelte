<script lang="ts">
	import { Icon, Pill, Surface } from 'bref-ui';
	import { Surface as DarkSurface, Theme } from 'bref-ui-themes/vscode';
	import Caption from '../components/caption.svelte';
	import { fade, progress } from '../motion.js';
	import { product } from '../product.js';
	import { scenes } from '../timeline.js';

	let { time }: { time: number } = $props();

	const duration = scenes.find((scene) => scene.id === 'eval')!.duration;

	type Outcome = 'fail' | 'pass' | 'skip';
	interface Case {
		file: string;
		/** The one line of copy in the eval's file. */
		copy: string;
		/** How many words go on the first line, when the copy needs two. */
		wrap?: number;
		expect: Outcome;
		/** The word both lines of a near-miss pair share, highlighted. */
		mark?: string;
		/** Why the case gets its outcome, beside its file. */
		note?: string;
	}
	interface Pair {
		cases: [Case, Case];
		/** What makes the two cases look alike. */
		note?: string;
	}

	// The six `brand-voice` evals as three near-miss pairs: the one that must fail on the left.
	const pairs: Pair[] = [
		{
			cases: [
				{
					file: 'content/pricing.md',
					copy: 'Guaranteed to double your conversions in 30 days.',
					wrap: 4,
					expect: 'fail',
					mark: 'Guaranteed'
				},
				{
					file: 'content/pricing.md',
					copy: '30-day money-back guarantee. See the terms.',
					wrap: 3,
					expect: 'pass',
					mark: 'guarantee'
				}
			],
			note: 'guarantee'
		},
		{
			cases: [
				{
					file: 'content/pricing.md',
					copy: 'Revolutionary pricing for world-class teams.',
					wrap: 2,
					expect: 'fail'
				},
				{ file: 'content/pricing.md', copy: 'Simple pricing for growing teams.', expect: 'pass' }
			]
		},
		{
			cases: [
				{
					file: 'emails/payment-failed.md',
					copy: 'You entered your card incorrectly.',
					expect: 'fail'
				},
				{
					file: 'CHANGELOG.md',
					copy: 'Guaranteed ordering for queue jobs.',
					expect: 'skip',
					note: 'not customer copy'
				}
			]
		}
	];
	const outcomeColor = { fail: 'error', pass: 'success', skip: 'muted' } as const;

	/** One line of copy, split so the shared word can be highlighted. */
	const highlight = (text: string, mark?: string) => {
		const at = mark ? text.indexOf(mark) : -1;
		if (!mark || at < 0) return [{ text, marked: false }];
		return [
			{ text: text.slice(0, at), marked: false },
			{ text: mark, marked: true },
			{ text: text.slice(at + mark.length), marked: false }
		];
	};
	/** The copy in quotation marks, on the lines it is shown on, each split for its highlight. */
	const quoted = ({ copy, wrap, mark }: Case) => {
		const words = copy.split(' ');
		const lines = wrap ? [words.slice(0, wrap), words.slice(wrap)] : [words];
		const text = lines.map((line) => line.join(' '));
		text[0] = `“${text[0]}`;
		text[text.length - 1] = `${text[text.length - 1]}”`;
		return text.map((line) => highlight(line, mark));
	};

	// Scene moments, in seconds on this scene's clock.
	const chipAt = 0.5;
	const firstRow = 1.8;
	const rowSpacing = 1.3;
	const totalAt = 5.8;
	const closingAt = 5.9;

	const rowAt = (row: number) => firstRow + row * rowSpacing;
	const checkAt = (row: number, side: number) => rowAt(row) + 0.65 + side * 0.15;

	const shown = $derived(1 - fade(time, duration - 0.3, duration));
	const chip = $derived(fade(time, chipAt, chipAt + 0.4));
	const total = $derived(fade(time, totalAt, totalAt + 0.3));
	const closing = $derived(fade(time, closingAt, closingAt + 0.25));
	/** Each piece fades in while rising 24px into place. */
	const rise = (amount: number) => `0 ${(1 - amount) * 24}px`;
	/** 0 before the case's result, 1 a moment after, with a small overshoot on the way. */
	const checked = (row: number, side: number) => {
		const p = progress(time, checkAt(row, side), checkAt(row, side) + 0.25);
		return { opacity: Math.min(p * 2, 1), scale: 0.5 + 0.5 * p + 0.18 * Math.sin(p * Math.PI) };
	};
</script>

<div class="scene" style:opacity={shown}>
	<Caption step={3} text="Prove it on your evals" {time} />
	<div class="command" style:opacity={chip} style:translate={rise(chip)}>
		<Theme>
			<DarkSurface
				width="fit"
				orientation="horizontal"
				radius="1rem"
				shadow="medium"
				color="background"
				variant="filled"
			>
				<span class="prompt">$</span>
				<code>{product.command} eval brand-voice</code>
			</DarkSurface>
		</Theme>
	</div>
	<ol>
		{#each pairs as pair, row (row)}
			{@const arrived = fade(time, rowAt(row), rowAt(row) + 0.4)}
			{@const marked = fade(time, rowAt(row) + 0.25, rowAt(row) + 0.55)}
			<li style:opacity={arrived} style:translate={rise(arrived)}>
				{#each pair.cases as item, side (side)}
					{@const check = checked(row, side)}
					<div class="case" class:matched={time >= checkAt(row, side)}>
						<Surface
							color="background"
							variant="filled"
							height="fill"
							radius="1.25rem"
							shadow="small"
						>
							<span class="status">
								<i class="pending" style:opacity={1 - check.opacity}>
									<Icon name="radio_button_unchecked" />
								</i>
								<i class="check" style:opacity={check.opacity} style:scale={check.scale}>
									<Icon name="check_circle" filled />
								</i>
							</span>
							<header>
								<span class="file">{item.file}</span>
								{#if item.note}<span class="reason">{item.note}</span>{/if}
								<span class="must">must</span>
								<Pill
									label={item.expect}
									color={outcomeColor[item.expect]}
									variant="soft"
									size="large"
								/>
							</header>
							<p class="copy">
								{#each quoted(item) as line, index (index)}
									<span class="line">
										{#each line as part, at (at)}
											<span class:marked={part.marked} style:--mark={part.marked ? marked : 0}>
												{part.text}
											</span>
										{/each}
									</span>
								{/each}
							</p>
						</Surface>
					</div>
				{/each}
				{#if pair.note}
					<div class="bracket" style:opacity={marked}>
						<span class="label">
							<span class="both">both say</span>
							<span class="marked" style:--mark={1}>“{pair.note}”</span>
						</span>
					</div>
				{/if}
			</li>
		{/each}
	</ol>
	<div class="total" style:opacity={total} style:translate={rise(total)}>
		<Theme>
			<DarkSurface
				width="fit"
				orientation="horizontal"
				radius="1rem"
				shadow="medium"
				color="background"
				variant="filled"
			>
				<samp>6 of 6 eval(s) match.</samp>
			</DarkSurface>
		</Theme>
	</div>
	<p class="closing" style:opacity={closing} style:translate={rise(closing)}>
		<em>Proved</em>
		<span>before it blocks anything.</span>
	</p>
</div>

<style>
	.scene {
		position: absolute;
		inset: 0;
	}
	/* The command is a small chip in the caption's band, so the pairs below keep the stage. */
	.command {
		position: absolute;
		top: 72px;
		right: 96px;
	}
	.command > :global([data-bref-theme]),
	.total > :global([data-bref-theme]) {
		min-height: 0;
		background: transparent;
		font:
			400 28px / 1.5 var(--font-mono),
			monospace;
	}
	.command :global([data-surface]),
	.total :global([data-surface]) {
		gap: 0.6em;
		padding: 0.35em 0.9em;
	}
	.prompt {
		color: var(--color-success);
	}
	code {
		font: inherit;
		color: #e4e4e4;
		white-space: pre;
	}
	ol {
		position: absolute;
		top: 200px;
		left: 96px;
		width: 1728px;
		display: flex;
		flex-direction: column;
		gap: 44px;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		position: relative;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 20px;
	}
	.case {
		min-width: 0;
	}
	.case :global([data-surface]) {
		display: grid;
		grid-template-columns: 52px 1fr;
		grid-template-rows: auto 1fr;
		column-gap: 16px;
		row-gap: 6px;
		padding: 16px 28px 20px 22px;
		background: color-mix(in srgb, white 70%, var(--color-background));
		border-color: color-mix(in srgb, var(--color-foreground) 9%, transparent);
	}
	.matched :global([data-surface]) {
		border-color: color-mix(in srgb, var(--color-success) 55%, transparent);
	}
	/* Beside the first line of copy, like a checklist; well apart from the outcome it checks. */
	.status {
		grid-area: 2 / 1;
		align-self: start;
		display: grid;
		font-size: 48px;
	}
	.status > i {
		grid-area: 1 / 1;
		display: flex;
		font-style: normal;
	}
	.pending {
		color: color-mix(in srgb, var(--color-muted) 55%, transparent);
	}
	.check {
		color: var(--color-success);
	}
	/* Bref-ui draws icons at its thinnest weight; a bolder tick reads at a glance. */
	.check :global(span) {
		font-variation-settings:
			'FILL' 1,
			'wght' 500;
	}
	header {
		grid-area: 1 / 2;
		display: flex;
		align-items: center;
		gap: 14px;
		min-width: 0;
		font:
			600 24px / 1.25 var(--font-text),
			sans-serif;
	}
	.file {
		color: var(--color-muted);
		font:
			400 22px / 1.3 var(--font-mono),
			monospace;
		letter-spacing: 0;
		white-space: nowrap;
	}
	.reason {
		color: color-mix(in srgb, var(--color-foreground) 72%, var(--color-background));
		font-weight: 500;
		white-space: nowrap;
	}
	.must {
		margin-left: auto;
		color: var(--color-muted);
		font-weight: 500;
	}
	.copy {
		grid-area: 2 / 2;
		margin: 0;
		font:
			550 40px / 1.2 var(--font-text),
			sans-serif;
		letter-spacing: -0.02em;
	}
	.line {
		display: block;
		white-space: nowrap;
	}
	/* The opening quotation mark hangs, so the words align with the file above. */
	.line:first-child {
		text-indent: -0.42em;
	}
	/* A highlighter stroke behind the word a pair shares; --mark fades it in. */
	.marked {
		border-radius: 0.2em;
		background: color-mix(in srgb, var(--color-warning) calc(var(--mark) * 22%), transparent);
		box-decoration-break: clone;
	}
	/* Joins the two cases of a pair from below, with what they share. */
	.bracket {
		position: absolute;
		top: calc(100% + 2px);
		left: calc(25% - 5px);
		right: calc(25% - 5px);
		height: 18px;
		display: flex;
		justify-content: center;
		align-items: flex-end;
		border: 2px solid color-mix(in srgb, var(--color-muted) 45%, transparent);
		border-top: none;
		border-radius: 0 0 14px 14px;
		font:
			500 24px / 1 var(--font-text),
			sans-serif;
	}
	.both {
		color: var(--color-muted);
	}
	.label {
		display: flex;
		gap: 0.3em;
		padding: 0 0.4em;
		translate: 0 50%;
		background-color: var(--color-background);
	}
	.total {
		position: absolute;
		top: 810px;
		left: 96px;
	}
	samp {
		font: inherit;
		color: var(--color-success);
	}
	.closing {
		position: absolute;
		top: 902px;
		left: 96px;
		display: flex;
		gap: 0.26em;
		margin: 0;
		font:
			650 64px / 1.1 var(--font-text),
			sans-serif;
		letter-spacing: -0.03em;
		white-space: nowrap;
	}
	em {
		color: var(--color-primary);
		font-style: normal;
	}
</style>

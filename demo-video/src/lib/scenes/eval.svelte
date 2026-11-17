<script lang="ts">
	import { Icon, Pill, Surface } from 'bref-ui';
	import Caption from '../components/caption.svelte';
	import Terminal from '../components/terminal.svelte';
	import type { TerminalLine } from '../components/terminal.svelte';
	import { fade, progress } from '../motion.js';
	import { product } from '../product.js';
	import { scenes } from '../timeline.js';

	let { time }: { time: number } = $props();

	const duration = scenes.find((scene) => scene.id === 'eval')!.duration;

	type Outcome = 'fail' | 'pass' | 'skip';
	interface Example {
		name: string;
		file: string;
		/** The code that matters, one or two lines as a formatter would break it. */
		code: string[];
		expect: Outcome;
	}

	// The six evals of `errors-hide-internals`, in the order the CLI runs them.
	const examples: Example[] = [
		{
			name: 'file-path-sent',
			file: 'src/routes/user.ts',
			code: ['res.status(500).send(__filename);'],
			expect: 'fail'
		},
		{
			name: 'internal-host-sent',
			file: 'src/routes/user.ts',
			code: ['res.status(502)', "  .send('db.internal:5432');"],
			expect: 'fail'
		},
		{
			name: 'logger-is-not-a-route',
			file: 'src/lib/log.ts',
			code: ['console.error(err.stack);'],
			expect: 'skip'
		},
		{
			name: 'sql-sent',
			file: 'src/routes/user.ts',
			code: ['res.status(500)', '  .send(`Bad query: ${sql}`);'],
			expect: 'fail'
		},
		{
			name: 'stack-trace-only-logged',
			file: 'src/routes/user.ts',
			code: ['console.error(err.stack);', "res.status(500).send('Error');"],
			expect: 'pass'
		},
		{
			name: 'stack-trace-sent',
			file: 'src/routes/user.ts',
			code: ['res.status(500).send(err.stack);'],
			expect: 'fail'
		}
	];
	const outcomeColor = { fail: 'error', pass: 'success', skip: 'muted' } as const;

	// Scene moments, in seconds on this scene's clock.
	const typed = 0.35;
	const firstEval = 1.5;
	const spacing = 0.48;
	const settle = 0.3;
	const totalled = 4.55;

	const evalAt = (index: number) => firstEval + index * spacing;
	const resultAt = (index: number) => evalAt(index) + settle;

	const lines: TerminalLine[] = [
		{
			at: typed,
			text: `${product.command} eval errors-hide-internals`,
			kind: 'command',
			typed: 1
		},
		...examples.flatMap((example, index): TerminalLine[] => [
			{ at: evalAt(index), text: `Eval ${example.name}`, kind: 'muted' },
			{
				at: resultAt(index),
				text: `✓ Expected ${example.expect}, got ${example.expect}`,
				kind: 'pass'
			}
		]),
		{ at: totalled, text: '6 of 6 eval(s) match.', kind: 'pass' }
	];

	const shown = $derived(1 - fade(time, duration - 0.3, duration));
	const terminalIn = $derived(fade(time, 0, 0.4));
	const tilesIn = $derived(fade(time, 0.08, 0.48));
	const totalIn = $derived(fade(time, totalled, totalled + 0.3));
	/** 0 before the eval's result prints, 1 a moment after, with a small overshoot on the way. */
	const checked = (index: number) => {
		const p = progress(time, resultAt(index), resultAt(index) + 0.25);
		return { opacity: Math.min(p * 2, 1), scale: 0.5 + 0.5 * p + 0.18 * Math.sin(p * Math.PI) };
	};
</script>

<div class="scene" style:opacity={shown}>
	<Caption step={3} text="Prove it on evals" {time} />
	<div class="terminal" style:opacity={terminalIn} style:translate={`0 ${(1 - terminalIn) * 24}px`}>
		<Terminal {lines} {time} />
	</div>
	<ul style:opacity={tilesIn} style:translate={`0 ${(1 - tilesIn) * 24}px`}>
		{#each examples as example, index (example.name)}
			{@const check = checked(index)}
			<li class:running={time >= evalAt(index)} class:matched={time >= resultAt(index)}>
				<Surface color="background" variant="filled" height="fill" radius="1.25rem" shadow="small">
					<header>
						<span class="status">
							<i class="pending" style:opacity={1 - check.opacity}>
								<Icon name="radio_button_unchecked" />
							</i>
							<i class="check" style:opacity={check.opacity} style:scale={check.scale}>
								<Icon name="check_circle" filled />
							</i>
						</span>
						<h3>{example.name}</h3>
					</header>
					<div class="code">
						<span class="file">{example.file}</span>
						{#each example.code as line (line)}
							<code>{line}</code>
						{/each}
					</div>
					<footer>
						<span class="expects">expects</span>
						<Pill
							label={example.expect}
							color={outcomeColor[example.expect]}
							variant="soft"
							size="large"
						/>
					</footer>
				</Surface>
			</li>
		{/each}
	</ul>
	<div class="total" style:opacity={totalIn} style:translate={`0 ${(1 - totalIn) * 24}px`}>
		<Surface color="success" variant="soft" orientation="horizontal" height="fill" radius="1.25rem">
			<span class="seal"><Icon name="check_circle" filled /></span>
			<strong>6 of 6</strong>
			<span class="label">evals match</span>
		</Surface>
	</div>
</div>

<style>
	.scene {
		position: absolute;
		inset: 0;
	}
	.terminal {
		--code-size: 24px;
		position: absolute;
		top: 200px;
		left: 96px;
		width: 720px;
		height: 676px;
	}
	ul {
		position: absolute;
		top: 200px;
		left: 864px;
		width: 960px;
		height: 676px;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		grid-template-rows: repeat(3, 1fr);
		gap: 20px 24px;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		min-width: 0;
		min-height: 0;
	}
	li :global([data-surface]) {
		gap: 8px;
		padding: 14px 20px;
		background: color-mix(in srgb, white 70%, var(--color-background));
		border-color: color-mix(in srgb, var(--color-foreground) 9%, transparent);
	}
	.running :global([data-surface]) {
		border-color: color-mix(in srgb, var(--color-primary) 70%, transparent);
	}
	.matched :global([data-surface]) {
		border-color: color-mix(in srgb, var(--color-success) 55%, transparent);
	}
	header {
		display: flex;
		align-items: center;
		gap: 12px;
		min-width: 0;
	}
	.status {
		display: grid;
		flex-shrink: 0;
		font-size: 40px;
	}
	.status > i {
		grid-area: 1 / 1;
		display: flex;
		font-style: normal;
	}
	.pending {
		color: color-mix(in srgb, var(--color-muted) 55%, transparent);
	}
	.running .pending {
		color: var(--color-primary);
	}
	.check {
		color: var(--color-success);
	}
	/* Bref-ui draws icons at its thinnest weight; a bolder tick reads at a glance. */
	.check :global(span),
	.seal :global(span) {
		font-variation-settings:
			'FILL' 1,
			'wght' 500;
	}
	h3 {
		margin: 0;
		overflow: hidden;
		font:
			600 26px / 1.25 var(--font-text),
			sans-serif;
		letter-spacing: -0.02em;
		white-space: nowrap;
	}
	.code {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
		padding: 8px 14px;
		border-radius: 10px;
		background: color-mix(in srgb, var(--color-foreground) 5%, transparent);
		font-family: var(--font-mono), monospace;
		letter-spacing: 0;
	}
	.file {
		margin-bottom: 2px;
		color: var(--color-muted);
		font-size: 16px;
		line-height: 1.35;
	}
	code {
		overflow: hidden;
		font: inherit;
		font-size: 19px;
		line-height: 1.35;
		white-space: pre;
		text-overflow: ellipsis;
	}
	footer {
		display: flex;
		align-items: center;
		gap: 10px;
		font:
			600 22px / 1.25 var(--font-text),
			sans-serif;
	}
	.expects {
		color: var(--color-muted);
		font-weight: 500;
	}
	.total {
		position: absolute;
		top: 896px;
		left: 96px;
		width: 1728px;
		height: 112px;
	}
	.total :global([data-surface]) {
		justify-content: center;
		gap: 24px;
		padding: 0 32px;
	}
	.seal {
		display: flex;
		font-size: 72px;
		color: var(--color-success);
	}
	strong {
		font:
			700 80px / 1 var(--font-text),
			sans-serif;
		letter-spacing: -0.04em;
		font-variant-numeric: tabular-nums;
	}
	.label {
		font:
			600 40px / 1 var(--font-text),
			sans-serif;
		letter-spacing: -0.02em;
	}
</style>

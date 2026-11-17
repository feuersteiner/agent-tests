<script lang="ts">
	import { Surface, Theme } from 'bref-ui-themes/vscode';
	import { fade } from '../motion.js';
	import { product } from '../product.js';
	import { clamp, ease } from '../timeline.js';

	let { time }: { time: number } = $props();

	// First the lens widens: any rule a company can say in a sentence works the same way.
	// The label and the rules arrive almost together and hold still until 3 s, so each rule gets about 2 s.
	const rules = [
		'Payment errors say whether money was taken.',
		'Error responses hide internals.',
		'The launch is in September, everywhere.'
	];
	const ruleAt = (index: number) => 0.3 + index * 0.15;

	// Then the rules lift away and the poster takes the stage. The rules are all but gone
	// before the first letter shows, so the two never share a frame, and the poster has settled by 3.7 s.
	const yieldFrom = 3;
	const yieldTo = 3.2;
	const posterFrom = 3.15;
	const settled = 3.7;

	// The wordmark is monospace, so its width is its length times 0.6 em: a long name gets a smaller size.
	const letters = Array.from(product.name);
	const wordmarkSize = Math.min(168, Math.floor(1500 / (letters.length * 0.6)));
	// Letters rise one after another and have all landed by 3.65 s, whatever the length.
	const stagger = Math.min(0.02, 0.16 / Math.max(letters.length - 1, 1));
	const letterRise = 3.65 - posterFrom - stagger * (letters.length - 1);

	// A short tagline gets presence on one line; a long one steps down and wraps.
	const taglineSize = Math.round(clamp(1400 / (Array.from(product.tagline).length * 0.52), 52, 80));
	const command = `${product.command} init`;

	const label = $derived(fade(time, 0.2, 0.5));
	const yielded = $derived(fade(time, yieldFrom, yieldTo));
	const tagline = $derived(fade(time, 3.25, settled));
	const chip = $derived(fade(time, 3.3, settled));
	const repository = $derived(fade(time, 3.35, settled));
	// Each piece fades in while rising 24px into place.
	const rise = (shown: number) => `0 ${(1 - shown) * 24}px`;
</script>

<!-- Any rule you can say in a sentence: three rules stack up, then give way to the poster. -->
<div class="rules" style:opacity={1 - yielded} style:translate={`0 ${yielded * -40}px`}>
	<div class="stack">
		<p class="label" style:opacity={label} style:translate={rise(label)}>
			Any rule you can say in a sentence:
		</p>
		<ul>
			{#each rules as rule, index (rule)}
				{@const shown = fade(time, ruleAt(index), ruleAt(index) + 0.35)}
				<li style:opacity={shown} style:translate={rise(shown)}>{rule}</li>
			{/each}
		</ul>
	</div>
</div>

<!-- The poster: the name, what it does, the one command that starts it, and where it lives. No exit. -->
<div class="poster">
	<h1 aria-label={product.name} style:font-size={`${wordmarkSize}px`}>
		{#each letters as letter, index (index)}
			{@const shown = ease((time - posterFrom - index * stagger) / letterRise)}
			<span class="mask" aria-hidden="true">
				<span
					class="letter"
					style:opacity={clamp(shown * 2)}
					style:translate={`0 ${(1 - shown) * 110}%`}
				>
					{letter}
				</span>
			</span>
		{/each}
	</h1>
	<p
		class="tagline"
		style:font-size={`${taglineSize}px`}
		style:opacity={tagline}
		style:translate={rise(tagline)}
	>
		{product.tagline}
	</p>
	<div class="chip" style:opacity={chip} style:translate={rise(chip)}>
		<Theme>
			<Surface
				width="fit"
				orientation="horizontal"
				radius="1.5rem"
				shadow="medium"
				color="background"
				variant="filled"
			>
				<span class="prompt">$</span>
				<code>{command}</code>
			</Surface>
		</Theme>
	</div>
</div>
<footer style:opacity={repository} style:translate={rise(repository)}>
	{product.repository}
</footer>

<style>
	.rules {
		position: absolute;
		inset: 72px 96px;
		display: grid;
		place-items: center;
	}
	.label {
		margin: 0 0 40px;
		color: var(--color-muted);
		font:
			500 40px / 1.3 var(--font-text),
			sans-serif;
		letter-spacing: -0.01em;
	}
	.stack {
		text-align: left;
	}
	ul {
		display: flex;
		flex-direction: column;
		gap: 32px;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		color: var(--color-foreground);
		font:
			650 68px / 1.12 var(--font-text),
			sans-serif;
		letter-spacing: -0.035em;
		white-space: nowrap;
	}
	/* The bottom inset leaves room for the repository line under the poster. */
	.poster {
		position: absolute;
		inset: 72px 96px 140px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
	}
	h1 {
		display: flex;
		margin: 0;
		color: var(--color-foreground);
		font-family: var(--font-mono), monospace;
		font-weight: 700;
		line-height: 1.15;
		letter-spacing: -0.03em;
		white-space: nowrap;
	}
	/* The padding keeps ascenders and descenders inside the mask once a letter has landed. */
	.mask {
		display: inline-block;
		overflow: hidden;
		padding: 0.15em 0;
		margin: -0.15em 0;
	}
	.letter {
		display: inline-block;
		white-space: pre;
	}
	.tagline {
		max-width: 1500px;
		margin: 28px 0 0;
		color: var(--color-primary);
		font-family: var(--font-text), sans-serif;
		font-weight: 600;
		line-height: 1.15;
		letter-spacing: -0.035em;
		text-wrap: balance;
	}
	.chip {
		margin-top: 80px;
	}
	.chip > :global([data-bref-theme]) {
		min-height: 0;
		background: transparent;
		font:
			400 40px / 1.5 var(--font-mono),
			monospace;
	}
	.chip :global([data-surface]) {
		gap: 0.6em;
		padding: 0.55em 1.1em;
	}
	.prompt {
		color: var(--color-success);
	}
	code {
		font: inherit;
		color: #e4e4e4;
		white-space: pre;
	}
	footer {
		position: absolute;
		right: 96px;
		bottom: 88px;
		left: 96px;
		color: var(--color-muted);
		font:
			500 32px / 1.3 var(--font-text),
			sans-serif;
		letter-spacing: 0;
		text-align: center;
	}
</style>

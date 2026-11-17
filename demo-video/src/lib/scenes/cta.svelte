<script lang="ts">
	import { Surface, Theme } from 'bref-ui-themes/vscode';
	import { fade, progress } from '../motion.js';
	import { product } from '../product.js';
	import { clamp, smooth, typeChars } from '../timeline.js';

	let { time }: { time: number } = $props();

	// The wordmark is monospace, so its width is its length times 0.6 em: a long name gets a smaller size.
	const letters = Array.from(product.name);
	const wordmarkSize = Math.min(168, Math.floor(1500 / (letters.length * 0.6)));
	// Letters rise one after another from 0.3 s and have all landed by about 1.15 s, whatever the length.
	const stagger = Math.min(0.035, 0.35 / Math.max(letters.length - 1, 1));

	const command = `${product.command} init`;
	// Typing starts once the chip has landed, at about 32 characters per second.
	const typeFrom = 2.15;
	const typeTo = typeFrom + Array.from(command).length / 32;

	const tagline = $derived(fade(time, 1, 1.6));
	const chip = $derived(fade(time, 1.75, 2.15));
	const typed = $derived(typeChars(command, progress(time, typeFrom, typeTo)));
	const typing = $derived(time >= typeFrom && time < typeTo);
	const repository = $derived(fade(time, 2.8, 3.3));
	// Each piece fades in while rising 24px into place.
	const rise = (shown: number) => `0 ${(1 - shown) * 24}px`;
</script>

<!-- The poster: the name, what it does, the one command that starts it, and where it lives. No exit. -->
<div class="poster">
	<h1 aria-label={product.name} style:font-size={`${wordmarkSize}px`}>
		{#each letters as letter, index (index)}
			{@const shown = smooth((time - 0.3 - index * stagger) / 0.5)}
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
	<p style:opacity={tagline} style:translate={rise(tagline)}>{product.tagline}</p>
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
				<code aria-label={command}>
					<span class="ghost" aria-hidden="true">{command}</span>
					<span class="line" aria-hidden="true">
						<span class="typed">{typed}</span>
						{#if typing}<span class="cursor"></span>{/if}
					</span>
				</code>
			</Surface>
		</Theme>
	</div>
</div>
<footer style:opacity={repository} style:translate={rise(repository)}>{product.repository}</footer>

<style>
	.poster {
		position: absolute;
		inset: 72px 96px 168px;
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
	p {
		max-width: 1240px;
		margin: 40px 0 0;
		color: color-mix(in srgb, var(--color-foreground) 72%, var(--color-background));
		font:
			400 52px / 1.3 var(--font-text),
			sans-serif;
		letter-spacing: -0.02em;
		text-wrap: balance;
	}
	.chip {
		margin-top: 80px;
	}
	.chip > :global([data-bref-theme]) {
		min-height: 0;
		background: transparent;
		font:
			400 44px / 1.5 var(--font-mono),
			monospace;
	}
	.chip :global([data-surface]) {
		gap: 0.6em;
		padding: 0.55em 1.1em;
	}
	.prompt {
		color: var(--color-success);
	}
	/* The full command sits invisibly under the typed one, so the chip keeps its width while typing. */
	code {
		display: grid;
		font: inherit;
		color: #e4e4e4;
	}
	.ghost,
	.line {
		grid-area: 1 / 1;
	}
	.ghost {
		visibility: hidden;
		white-space: pre;
	}
	.line {
		display: flex;
	}
	.typed {
		white-space: pre;
	}
	.cursor {
		width: 0.55em;
		margin: 0.2em 0;
		background: #cccccc;
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

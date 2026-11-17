<script lang="ts">
	import { fade } from '../motion.js';
	import { clamp, scenes, smooth } from '../timeline.js';

	let { time }: { time: number } = $props();

	const duration = scenes.find((scene) => scene.id === 'decision')!.duration;

	// The decision as the people who made it would say it, one commitment per line. The first has
	// already landed at time 0, so the poster frame reads the label and "No hype."; the other two
	// follow a second apart, and all three are set by 2.8 s. Then nothing moves until the exit.
	const commitments = [
		{ text: 'No hype.', at: -1 },
		{ text: 'No guarantees.', at: 1 },
		{ text: 'Never blame the customer.', at: 2 }
	];
	// Each word rises out of its mask after the one before it, like the film's other headlines.
	const stagger = 0.12;
	const rise = 0.45;

	const shown = $derived(1 - fade(time, duration - 0.3, duration));
	const landed = (at: number, index: number) => smooth((time - at - index * stagger) / rise);
</script>

<!-- The decision card: who decided and when, a rule under it, and the three commitments. -->
<div style:opacity={shown}>
	<p>Marketing · March</p>
	<hr />
	<ol>
		{#each commitments as commitment (commitment.text)}
			<li aria-label={commitment.text}>
				{#each commitment.text.split(' ') as word, index (index)}
					{@const share = landed(commitment.at, index)}
					<span class="mask" aria-hidden="true">
						<span
							class="word"
							style:opacity={clamp(share * 3)}
							style:translate={`0 ${(1 - share) * 110}%`}
						>
							{word}
						</span>
					</span>
				{/each}
			</li>
		{/each}
	</ol>
</div>

<style>
	div {
		position: absolute;
		inset: 0;
	}
	/*
	 * Left-aligned from the safe margin, so the three commitments read as three items of one
	 * decision. The block sits a little above the middle of the frame, where the eye rests.
	 */
	p {
		position: absolute;
		top: 228px;
		left: 96px;
		margin: 0;
		color: var(--color-muted);
		font:
			500 40px / 1.3 var(--font-text),
			sans-serif;
		letter-spacing: -0.01em;
	}
	/* A hairline across the safe area, so the poster frame reads as a card before it is full. */
	hr {
		position: absolute;
		top: 306px;
		left: 96px;
		width: 1728px;
		height: 2px;
		margin: 0;
		border: 0;
		background: color-mix(in srgb, var(--color-foreground) 14%, var(--color-background));
	}
	ol {
		position: absolute;
		top: 342px;
		left: 96px;
		width: 1728px;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		display: flex;
		column-gap: 0.26em;
		font:
			650 136px / 1.14 var(--font-text),
			sans-serif;
		letter-spacing: -0.045em;
		white-space: nowrap;
	}
	/* The padding keeps descenders inside the mask once a word has landed. */
	.mask {
		display: inline-block;
		overflow: hidden;
		padding: 0.06em 0.04em 0.1em;
		margin: -0.06em -0.04em -0.1em;
	}
	.word {
		display: inline-block;
	}
</style>

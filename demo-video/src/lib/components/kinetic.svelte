<script lang="ts">
	import { clamp, smooth } from '../timeline.js';

	let {
		text,
		time,
		at = 0,
		accent
	}: { text: string; time: number; at?: number; accent?: string } = $props();

	const words = $derived(text.split(/\s+/).filter(Boolean));
	// A word matches the accent with or without surrounding punctuation, so "first." matches "first".
	const bare = (word: string) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
	const isAccent = (word: string) =>
		accent !== undefined && (word === accent || bare(word) === bare(accent));
</script>

<!-- A large centered headline whose words rise into view one after another from `at`. -->
<div aria-label={text}>
	<p aria-hidden="true">
		{#each words as word, index (index)}
			{@const shown = smooth((time - at - index * 0.12) / 0.45)}
			<span class="mask">
				<span
					class="word"
					class:accent={isAccent(word)}
					style:opacity={clamp(shown * 3)}
					style:translate={`0 ${(1 - shown) * 110}%`}
				>
					{word}
				</span>
			</span>
		{/each}
	</p>
</div>

<style>
	div {
		position: absolute;
		inset: 0;
		z-index: 10;
		display: grid;
		place-items: center;
		padding: 0 160px;
		pointer-events: none;
	}
	p {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		column-gap: 0.26em;
		margin: 0;
		font:
			650 var(--kinetic-size, 132px) / 1.08 var(--font-text),
			sans-serif;
		letter-spacing: -0.045em;
		text-align: center;
	}
	.mask {
		display: inline-block;
		overflow: hidden;
		padding: 0.06em 0.04em 0.1em;
		margin: -0.06em -0.04em -0.1em;
	}
	.word {
		display: inline-block;
		white-space: nowrap;
	}
	.accent {
		color: var(--color-primary);
	}
</style>

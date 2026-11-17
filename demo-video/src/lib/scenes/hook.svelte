<script lang="ts">
	import Kinetic from '../components/kinetic.svelte';
	import { fade } from '../motion.js';
	import { product } from '../product.js';
	import { clamp, scenes } from '../timeline.js';

	let { time }: { time: number } = $props();

	const duration = scenes.find((scene) => scene.id === 'hook')!.duration;

	// One kinetic line per phrase, so the breaks fall between phrases. The first line has just
	// settled at time 0, so the poster frame reads "Your agent made", and "again." lands on its own beat.
	const lines: { text: string; at: number; accent?: string }[] = [
		{ text: 'Your agent made', at: -0.7 },
		{ text: 'the same mistake', at: 0.1 },
		{ text: 'again.', at: 0.8, accent: 'again.' }
	];
	const spacing = 168;
	const middle = 520;
	// Word by word like the headline, so the gaps between words match it.
	const promise = ['Write', 'the', 'rule', 'once.'];

	// The headline lifts away, the answer rises into its place, the wordmark settles under it.
	// The headline is all but gone before the answer starts, so the two never overlap.
	const away = $derived(fade(time, 1.8, 2.2));
	const answer = $derived(fade(time, 2.1, 2.55));
	const mark = $derived(fade(time, 2.35, 2.8));
	const exit = $derived(1 - fade(time, duration - 0.3, duration));
</script>

<div class="scene" style:opacity={exit}>
	<div class="headline" style:opacity={1 - away} style:translate={`0 ${away * -96}px`}>
		{#each lines as line, index (line.text)}
			<div class="line" style:top={`${middle + (index - 1) * spacing - spacing / 2}px`}>
				<Kinetic text={line.text} {time} at={line.at} accent={line.accent} />
			</div>
		{/each}
	</div>
	<div class="answer">
		<p style:opacity={clamp(answer * 3)} style:translate={`0 ${(1 - answer) * 110}%`}>
			{#each promise as word (word)}
				<span class:accent={word === 'once.'}>{word}</span>
			{/each}
		</p>
	</div>
	<p class="wordmark" style:opacity={mark} style:translate={`0 ${(1 - mark) * 24}px`}>
		{product.name}
	</p>
</div>

<style>
	.scene {
		position: absolute;
		inset: 0;
	}
	.headline {
		position: absolute;
		inset: 0;
	}
	.line {
		position: absolute;
		left: 0;
		width: 1920px;
		height: 168px;
		--kinetic-size: 150px;
	}
	.answer {
		position: absolute;
		top: 400px;
		left: 96px;
		width: 1728px;
		overflow: hidden;
		padding: 0.06em 0 0.1em;
		font-size: 128px;
	}
	.answer p {
		display: flex;
		justify-content: center;
		column-gap: 0.26em;
		margin: 0;
		font:
			650 128px / 1.08 var(--font-text),
			sans-serif;
		letter-spacing: -0.045em;
	}
	.accent {
		color: var(--color-primary);
	}
	.wordmark {
		position: absolute;
		top: 600px;
		left: 96px;
		width: 1728px;
		margin: 0;
		font:
			600 56px / 1.4 var(--font-mono),
			monospace;
		letter-spacing: -0.01em;
		text-align: center;
	}
</style>

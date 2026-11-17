<script lang="ts">
	import { Pill } from 'bref-ui';
	import { fade } from '../motion.js';

	let {
		step,
		text,
		time,
		at = 0
	}: { step?: number; text: string; time: number; at?: number } = $props();

	const shown = $derived(fade(time, at, at + 0.5));
</script>

<!-- The chapter caption, docked top-left of the stage. -->
<header style:opacity={shown} style:translate={`${(1 - shown) * -32}px 0`}>
	{#if step !== undefined}
		<span>
			<Pill label={String(step)} color="primary" variant="filled" size="large" />
		</span>
	{/if}
	<h2>{text}</h2>
</header>

<style>
	header {
		position: absolute;
		top: 72px;
		left: 96px;
		z-index: 20;
		display: flex;
		align-items: center;
		gap: 24px;
		pointer-events: none;
	}
	span {
		display: flex;
		zoom: 1.75;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	h2 {
		margin: 0;
		font:
			600 48px / 1.1 var(--font-text),
			sans-serif;
		letter-spacing: -0.03em;
		white-space: nowrap;
	}
</style>

<script lang="ts">
	import { Icon } from 'bref-ui';
	import Editor from '../components/editor.svelte';
	import type { EditorMark } from '../components/editor.svelte';
	import { fade } from '../motion.js';
	import { scenes } from '../timeline.js';

	let { time }: { time: number } = $props();

	const duration = scenes.find((scene) => scene.id === 'drift')!.duration;

	// The pricing page exactly as the agent wrote it: each line of copy breaks one commitment.
	const page = [
		'# Revolutionary pricing for world-class teams',
		'',
		'Guaranteed to double your conversions in 30 days.',
		'',
		'If checkout fails, you entered your card incorrectly.'
	].join('\n');

	// The violations, called out top to bottom, each tagged with the commitment it breaks.
	const flags = [
		{ line: 1, tag: 'hype', at: 1.4 },
		{ line: 3, tag: 'guarantee', at: 2.6 },
		{ line: 5, tag: 'blame', at: 3.8 }
	];
	const marks: EditorMark[] = flags.map(({ line, at }) => ({ line, at, kind: 'flag' }));
	const closed = 4.9;

	const entered = $derived(fade(time, 0, 0.4));
	const credited = $derived(fade(time, 0.2, 0.6));
	// A short entrance, so the closing line holds still for 2.55 s before the exit.
	const closing = $derived(fade(time, closed, closed + 0.25));
	const shown = $derived(1 - fade(time, duration - 0.3, duration));
	const flagged = (at: number) => fade(time, at, at + 0.3);
</script>

<div class="scene" style:opacity={shown}>
	<div class="content" style:opacity={entered} style:translate={`0 ${(1 - entered) * 24}px`}>
		<p class="author" style:opacity={credited}>
			<span class="robot"><Icon name="smart_toy" /></span>
			<span>written by your coding agent</span>
		</p>
		<div class="panel">
			<Editor file="content/pricing.md" code={page} {marks} {time} />
		</div>
		<!-- Each tag is anchored to the end of its line's text, so it sits beside the copy, never over it. -->
		{#each flags as flag (flag.tag)}
			<p
				class="tag"
				style:position-anchor={`--line-${flag.line}`}
				style:opacity={flagged(flag.at)}
				style:translate={`${(1 - flagged(flag.at)) * -16}px -50%`}
			>
				<Icon name="flag" filled />
				<span>{flag.tag}</span>
			</p>
		{/each}
	</div>
	<p class="closing" style:opacity={closing} style:translate={`0 ${(1 - closing) * 24}px`}>
		<span>Decisions travel slowly.</span>
		<span class="accent">Agents write fast.</span>
	</p>
</div>

<style>
	.scene {
		position: absolute;
		inset: 0;
	}
	.content {
		position: absolute;
		inset: 0;
	}
	.author {
		position: absolute;
		top: 172px;
		left: 96px;
		display: flex;
		align-items: center;
		gap: 12px;
		margin: 0;
		color: var(--color-muted);
		font:
			500 32px / 1.3 var(--font-text),
			sans-serif;
		white-space: nowrap;
	}
	.robot {
		display: flex;
		font-size: 44px;
	}
	/* Just tall enough for the five lines, so no empty editor sits under them. */
	.panel {
		--code-size: 42px;
		position: absolute;
		top: 236px;
		left: 96px;
		width: 1728px;
		height: 520px;
	}
	/* The tab bar keeps the size it has in every other scene; only the code is larger here. */
	.panel :global(header) {
		font-size: 26px;
	}
	/* Taller rows than the default, so each flagged band holds its tag with room to spare. */
	.panel :global(.code) {
		line-height: 1.8;
	}
	/* The flagged lines are the anchors their tags hang from. */
	.panel :global(.row:nth-child(1) .text) {
		anchor-name: --line-1;
	}
	.panel :global(.row:nth-child(3) .text) {
		anchor-name: --line-3;
	}
	.panel :global(.row:nth-child(5) .text) {
		anchor-name: --line-5;
	}
	.tag {
		position: absolute;
		top: anchor(center);
		left: calc(anchor(right) + 28px);
		display: flex;
		align-items: center;
		gap: 10px;
		margin: 0;
		padding: 6px 22px 6px 16px;
		border-radius: 999px;
		/* The editor theme's warning color, so each tag matches its line's flag mark. */
		background: #cca700;
		color: #1e1e1e;
		font:
			650 32px / 1.3 var(--font-text),
			sans-serif;
		letter-spacing: -0.01em;
		white-space: nowrap;
	}
	/* The scene's one closing line, baseline near y = 960, in the same place as the next scene's. */
	.closing {
		position: absolute;
		top: 908px;
		left: 96px;
		display: flex;
		column-gap: 0.26em;
		margin: 0;
		font:
			650 56px / 1.1 var(--font-text),
			sans-serif;
		letter-spacing: -0.03em;
		white-space: nowrap;
	}
	.accent {
		color: var(--color-primary);
	}
</style>

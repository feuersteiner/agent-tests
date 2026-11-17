<script lang="ts">
	import { Icon } from 'bref-ui';
	import Caption from '../components/caption.svelte';
	import Editor from '../components/editor.svelte';
	import { fade } from '../motion.js';
	import { scenes } from '../timeline.js';

	let { time }: { time: number } = $props();

	const duration = scenes.find((scene) => scene.id === 'rule')!.duration;

	// The film's one rule, exactly as its TEST.md is written.
	const rule = [
		'# Error responses hide internals',
		'',
		'Error responses from routes under `src/routes/` reveal no stack trace, SQL, file path, or internal host.',
		'',
		'Exceptions: details that are only logged.'
	].join('\n');
	const folder = '.agents/tests/errors-hide-internals/';
	const notes = ['Plain language.', 'No regex.', 'No prompts.'];

	// Scene moments, in seconds on this scene's clock.
	const typeFrom = 0.45;
	const typeTo = 3;
	const noted = 3.1;

	const entered = $derived(fade(time, 0, 0.4));
	const shown = $derived(1 - fade(time, duration - 0.3, duration));
	const noteShown = (index: number) => fade(time, noted + index * 0.12, noted + index * 0.12 + 0.3);
</script>

<div class="scene" style:opacity={shown}>
	<Caption step={1} text="Write the rule" {time} />
	<div class="content" style:opacity={entered} style:translate={`0 ${(1 - entered) * 24}px`}>
		<p>
			<Icon name="folder_open" />
			<span>{folder}</span>
		</p>
		<div class="panel">
			<Editor file="TEST.md" code={rule} {time} {typeFrom} {typeTo} />
		</div>
	</div>
	<ul style:--bar={fade(time, noted, noted + 0.5)}>
		{#each notes as note, index (note)}
			<li style:opacity={noteShown(index)} style:translate={`0 ${(1 - noteShown(index)) * 24}px`}>
				{note}
			</li>
		{/each}
	</ul>
</div>

<style>
	.scene {
		position: absolute;
		inset: 0;
	}
	/* The path and the panel, centered in the content area below the caption (top 200, 808 tall). */
	.content {
		position: absolute;
		top: 248px;
		left: 96px;
		width: 1280px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}
	p {
		display: flex;
		align-items: center;
		gap: 14px;
		margin: 0;
		color: var(--color-muted);
		font:
			500 30px / 1.3 var(--font-mono),
			monospace;
		letter-spacing: 0;
	}
	span {
		white-space: nowrap;
	}
	.panel {
		--code-size: 44px;
		--gutter: calc(var(--code-size) * 2.75);
		/* Just tall enough for the whole file, so no empty editor sits under it. */
		height: 648px;
	}
	/* The tab bar keeps the size it has in every other scene; only the code is larger here. */
	.panel :global(header) {
		font-size: 26px;
	}
	/*
	 * The shared editor never wraps, and the rule's long sentence would run off the panel at this
	 * size. These overrides soft-wrap each line like an editor with word wrap on: the line number
	 * hangs in the gutter, wrapped text lines up under the first line's text, and the caret stays
	 * at the end of the typed text. The panel fits 43 characters a line, so the sentence breaks
	 * into three short lines and the last line of the file stays whole.
	 */
	.panel :global(.code) {
		padding-right: calc(var(--code-size) * 0.5);
	}
	.panel :global(.row) {
		display: block;
		padding-left: var(--gutter);
		text-indent: calc(-1 * var(--gutter));
		/* Drops the whitespace between the row's spans; each span sets its own size again. */
		font-size: 0;
	}
	.panel :global(.number) {
		display: inline-block;
		width: var(--gutter);
		padding-right: var(--code-size);
		font-size: var(--code-size);
		text-indent: 0;
	}
	.panel :global(.text) {
		display: inline;
		font-size: var(--code-size);
	}
	.panel :global(.text [data-token]) {
		white-space: pre-wrap;
	}
	.panel :global(.text [data-token='string']) {
		white-space: pre;
	}
	.panel :global(.caret) {
		display: inline-block;
		width: calc(var(--code-size) * 0.12);
		height: calc(var(--code-size) * 1.2);
		margin: 0 0 0 calc(var(--code-size) * 0.04);
		vertical-align: calc(var(--code-size) * -0.25);
		text-indent: 0;
	}
	ul {
		position: absolute;
		top: 564px;
		left: 1440px;
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin: 0;
		padding: 4px 0 4px 32px;
		list-style: none;
	}
	/* The note's accent bar draws downward as its lines rise in. */
	ul::before {
		content: '';
		position: absolute;
		inset: 0 auto 0 0;
		width: 4px;
		border-radius: 2px;
		background: var(--color-primary);
		opacity: var(--bar);
		scale: 1 var(--bar);
		transform-origin: top;
	}
	li {
		font:
			650 48px / 1.2 var(--font-text),
			sans-serif;
		letter-spacing: -0.03em;
		white-space: nowrap;
	}
	li:not(:first-child) {
		color: var(--color-muted);
	}
</style>

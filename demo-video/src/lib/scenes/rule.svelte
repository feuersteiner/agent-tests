<script lang="ts">
	import { Icon } from 'bref-ui';
	import Caption from '../components/caption.svelte';
	import Editor from '../components/editor.svelte';
	import { fade } from '../motion.js';
	import { scenes } from '../timeline.js';

	let { time }: { time: number } = $props();

	const duration = scenes.find((scene) => scene.id === 'rule')!.duration;

	// The decision from the meeting, written down exactly as its TEST.md is written.
	const rule = [
		'# Brand voice',
		'',
		'Customer-facing copy under `content/` and `emails/` says what the product does in plain words.',
		'It promises no result and never blames the reader for a problem.',
		'',
		'Exceptions: refund and legal terms.'
	].join('\n');
	const folder = '.agents/tests/brand-voice/';

	// Scene moments, in seconds on this scene's clock.
	const typeFrom = 0.6;
	const typeTo = 4;
	const closing = 4.4;

	const entered = $derived(fade(time, 0, 0.4));
	const shown = $derived(1 - fade(time, duration - 0.3, duration));
	const closed = $derived(fade(time, closing, closing + 0.45));
</script>

<div class="scene" style:opacity={shown}>
	<Caption step={1} text="Write it down once" {time} />
	<div class="content" style:opacity={entered} style:translate={`0 ${(1 - entered) * 24}px`}>
		<p class="path">
			<Icon name="folder_open" />
			<code>{folder}</code>
		</p>
		<div class="panel">
			<Editor file="TEST.md" code={rule} {time} {typeFrom} {typeTo} />
		</div>
	</div>
	<p class="closing" style:opacity={closed} style:translate={`0 ${(1 - closed) * 24}px`}>
		<strong>Plain language.</strong>
		<span>Nothing else.</span>
	</p>
</div>

<style>
	.scene {
		position: absolute;
		inset: 0;
	}
	/* The path and the panel, left-aligned under the caption; the closing line sits below them. */
	.content {
		position: absolute;
		top: 200px;
		left: 96px;
		display: flex;
		flex-direction: column;
		gap: 18px;
	}
	.path {
		display: flex;
		align-items: center;
		gap: 14px;
		margin: 0;
		color: var(--color-muted);
		font:
			500 32px / 1.3 var(--font-mono),
			monospace;
	}
	code {
		font: inherit;
		letter-spacing: 0;
		white-space: nowrap;
	}
	/*
	 * Sized to the file. A 40px character of the editor's JetBrains Mono is 23.68px wide, so a
	 * 1530px text column (1662 less the gutter, padding and border) holds 64 characters and the
	 * caret but not 65: the second sentence stays whole and the first wraps once, after "says
	 * what". Just tall enough for its seven rows, with even padding above and below.
	 */
	.panel {
		--code-size: 40px;
		--gutter: calc(var(--code-size) * 2.75);
		width: 1662px;
		height: 588px;
	}
	/* The tab bar keeps the size it has in every other scene; only the code is larger here. */
	.panel :global(header) {
		font-size: 26px;
	}
	/*
	 * The shared editor never wraps. These overrides soft-wrap each line like an editor with word
	 * wrap on: the line number hangs in the gutter, wrapped text lines up under the first line's
	 * text, inline code never breaks inside, and the caret stays at the end of the typed text.
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
	/* The scene's one closing line, baseline near y = 960, on the caption's left edge. */
	.closing {
		position: absolute;
		top: 908px;
		left: 96px;
		display: flex;
		gap: 0.26em;
		margin: 0;
		font:
			650 56px / 1.1 var(--font-text),
			sans-serif;
		letter-spacing: -0.03em;
		white-space: nowrap;
	}
	strong {
		font-weight: inherit;
		color: var(--color-primary);
	}
</style>

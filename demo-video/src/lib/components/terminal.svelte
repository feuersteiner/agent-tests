<script module lang="ts">
	export interface TerminalLine {
		/** Scene time at which the line appears; hidden before. */
		at: number;
		text: string;
		/** Defaults to 'output'. */
		kind?: 'command' | 'output' | 'pass' | 'fail' | 'muted';
		/** Seconds a command takes to type out from `at`; defaults to 0.6. */
		typed?: number;
	}
</script>

<script lang="ts">
	import { Icon, Surface, Theme } from 'bref-ui-themes/vscode';
	import { progress } from '../motion.js';
	import { typeChars } from '../timeline.js';

	let {
		title = 'Terminal',
		lines,
		time
	}: { title?: string; lines: TerminalLine[]; time: number } = $props();

	const shown = $derived(
		lines
			.filter((line) => time >= line.at)
			.map((line) => {
				const kind = line.kind ?? 'output';
				if (kind !== 'command') return { kind, text: line.text, typing: false };
				const end = line.at + (line.typed ?? 0.6);
				return {
					kind,
					text: typeChars(line.text, progress(time, line.at, end)),
					typing: time < end
				};
			})
	);
</script>

<!-- Fills its parent: give it a positioned, sized wrapper. Tune the text with --code-size. -->
<div class="terminal">
	<Theme>
		<Surface height="fill" radius="1rem" shadow="large" color="background" variant="filled">
			<header>
				<span class="lights" aria-hidden="true">
					<i></i>
					<i></i>
					<i></i>
				</span>
				<Icon name="terminal" />
				<span>{title}</span>
			</header>
			<div class="body">
				<div class="lines">
					{#each shown as line, index (index)}
						<div class="line" data-kind={line.kind}>
							{#if line.kind === 'command'}<span class="prompt">$</span>{/if}
							<span class="text">{line.text}</span>
							{#if line.typing}<span class="cursor"></span>{/if}
						</div>
					{/each}
				</div>
				<div class="filler"></div>
			</div>
		</Surface>
	</Theme>
</div>

<style>
	.terminal {
		width: 100%;
		height: 100%;
		min-height: 0;
	}
	.terminal > :global([data-bref-theme]) {
		height: 100%;
		background: transparent;
		font:
			400 var(--code-size, 26px) / 1.6 var(--font-mono),
			monospace;
	}
	.terminal :global([data-surface]) {
		overflow: hidden;
	}
	header {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		gap: 0.6em;
		padding: 0.55em 0.9em;
		background: var(--vscode-panel);
		border-bottom: 1px solid var(--vscode-border);
		color: var(--color-muted);
		font:
			500 0.8em / 1.2 var(--font-text),
			sans-serif;
	}
	.lights {
		display: flex;
		gap: 0.45em;
		margin-right: 0.6em;
	}
	i {
		width: 0.75em;
		height: 0.75em;
		border-radius: 50%;
		background: #4a4a4a;
	}
	/* Short output stays at the top; once it overflows, the newest lines stay in view. */
	.body {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		overflow: hidden;
		padding: 0.75em 1em;
		color: #cccccc;
	}
	.lines {
		flex-shrink: 0;
	}
	.filler {
		flex: 1 1 auto;
	}
	.line {
		display: flex;
		gap: 0.6em;
	}
	.line[data-kind='pass'] {
		color: var(--color-success);
	}
	.line[data-kind='fail'] {
		color: var(--color-error);
	}
	.line[data-kind='muted'] {
		color: #7a7a7a;
	}
	.prompt {
		flex-shrink: 0;
		color: var(--color-success);
	}
	.text {
		min-width: 0;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
	.cursor {
		flex-shrink: 0;
		width: 0.6em;
		margin: 0.2em 0 0.2em -0.6em;
		background: #cccccc;
	}
</style>

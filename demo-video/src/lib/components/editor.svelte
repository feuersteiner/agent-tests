<script module lang="ts">
	export interface EditorMark {
		/** 1-based line number. */
		line: number;
		/** Scene time from which the line is tinted. */
		at: number;
		kind: 'add' | 'remove' | 'flag';
	}
</script>

<script lang="ts">
	import { Surface, Tabs, Theme } from 'bref-ui-themes/vscode';
	import { fade, progress } from '../motion.js';
	import { languageOf, tokenize } from '../syntax.js';
	import { typeChars } from '../timeline.js';

	let {
		file,
		code,
		time,
		typeFrom,
		typeTo,
		marks = []
	}: {
		file: string;
		code: string;
		time: number;
		typeFrom?: number;
		typeTo?: number;
		marks?: EditorMark[];
	} = $props();

	const typing = $derived(typeFrom !== undefined && typeTo !== undefined);
	const shown = $derived(
		typing ? typeChars(code, progress(time, typeFrom ?? 0, typeTo ?? 0)) : code
	);
	const caret = $derived(typing && time >= (typeFrom ?? 0) && time < (typeTo ?? 0));
	const language = $derived(languageOf(file));
	const lines = $derived(shown.split('\n'));
	const markOf = (line: number) => marks.findLast((mark) => mark.line === line && time >= mark.at);
</script>

<!-- Fills its parent: give it a positioned, sized wrapper. Tune the text with --code-size. -->
<div class="editor">
	<Theme>
		<Surface height="fill" radius="1rem" shadow="large" color="background" variant="filled">
			<header>
				<Tabs
					items={[{ id: file, label: file, icon: 'description' }]}
					value={file}
					label="Open file"
				/>
			</header>
			<div class="code">
				{#each lines as line, index (index)}
					{@const mark = markOf(index + 1)}
					<div
						class="row"
						data-mark={mark?.kind}
						style:--mark-strength={mark ? fade(time, mark.at, mark.at + 0.25) : 0}
					>
						<span class="number">{index + 1}</span>
						<span class="text">
							{#each tokenize(line, language) as token, tokenIndex (tokenIndex)}
								<span data-token={token.kind}>{token.text}</span>
							{/each}
						</span>
						{#if caret && index === lines.length - 1}<span class="caret"></span>{/if}
					</div>
				{/each}
			</div>
		</Surface>
	</Theme>
</div>

<style>
	.editor {
		width: 100%;
		height: 100%;
		min-height: 0;
	}
	.editor > :global([data-bref-theme]) {
		height: 100%;
		background: transparent;
		font:
			400 var(--code-size, 26px) / 1.6 var(--font-mono),
			monospace;
	}
	.editor :global([data-surface]) {
		overflow: hidden;
	}
	header {
		flex-shrink: 0;
		padding: 0.5em 0.75em 0;
		background: var(--vscode-panel);
		border-bottom: 1px solid var(--vscode-border);
		font-family: var(--font-text);
		zoom: 1.4;
	}
	.code {
		flex: 1;
		min-height: 0;
		overflow: hidden;
		padding: 0.75em 0;
		color: #d4d4d4;
	}
	.row {
		--mark-color: transparent;
		display: flex;
		background: color-mix(in srgb, var(--mark-color) calc(var(--mark-strength) * 18%), transparent);
		box-shadow: inset calc(var(--mark-strength) * 0.25em) 0 0 var(--mark-color);
	}
	.row[data-mark='add'] {
		--mark-color: var(--color-success);
	}
	.row[data-mark='remove'] {
		--mark-color: var(--color-error);
	}
	.row[data-mark='flag'] {
		--mark-color: var(--color-warning);
	}
	.number {
		flex-shrink: 0;
		width: 3.5em;
		padding-right: 1.25em;
		text-align: right;
		color: #6e7681;
	}
	/* Flex drops the whitespace between token spans; only the tokens' own text is preserved. */
	.text {
		display: flex;
		min-width: 0;
	}
	[data-token] {
		white-space: pre;
	}
	.caret {
		width: 0.12em;
		margin: 0.2em 0 0.2em 0.04em;
		background: #aeafad;
	}
	[data-token='comment'] {
		color: #6a9955;
	}
	[data-token='string'] {
		color: #ce9178;
	}
	[data-token='key'] {
		color: #9cdcfe;
	}
	[data-token='keyword'] {
		color: #569cd6;
	}
	[data-token='number'] {
		color: #b5cea8;
	}
	[data-token='function'] {
		color: #dcdcaa;
	}
	[data-token='heading'] {
		color: #569cd6;
		font-weight: 700;
	}
	[data-token='strong'] {
		font-weight: 700;
	}
	[data-token='punctuation'] {
		color: #808080;
	}
</style>

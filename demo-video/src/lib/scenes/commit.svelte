<script lang="ts">
	import { Icon } from 'bref-ui';
	import Caption from '../components/caption.svelte';
	import Editor from '../components/editor.svelte';
	import type { EditorMark } from '../components/editor.svelte';
	import Terminal from '../components/terminal.svelte';
	import type { TerminalLine } from '../components/terminal.svelte';
	import { fade, progress } from '../motion.js';
	import { product } from '../product.js';
	import { scenes, typeChars } from '../timeline.js';

	let { time }: { time: number } = $props();

	const duration = scenes.find((scene) => scene.id === 'commit')!.duration;

	// Scene moments, in seconds on this scene's clock.
	const blocked = 3;
	const fixing = 6;
	const erased = 6.3;
	const rewritten = 6.9;
	const retried = 7;
	// The committed state lands by 8.2 and holds completely still until the exit at 10.7.
	const committed = 8;
	const landing = 0.2;

	// The launch email as the agent wrote it. Line 4 breaks the decision; the fix replaces only it.
	const before = ['# One-click checkout is live', '', 'Your customers can now pay in one step.'];
	const after = ['', 'Turn it on in Settings, under Checkout.'];
	const promise = 'Guaranteed to double your conversions in 30 days.';
	const typical = 'Most teams see results within a month.';
	const flagged = before.length + 1;
	const length = before.length + 1 + after.length;

	// The fix: the promise is erased, then the typical result is typed in its place.
	const code = $derived(
		[
			...before,
			time < erased
				? typeChars(promise, 1 - progress(time, fixing, erased))
				: typeChars(typical, progress(time, erased + 0.05, rewritten)),
			...after
		].join('\n')
	);
	const marks: EditorMark[] = $derived(
		time < erased
			? [{ line: flagged, at: blocked, kind: 'remove' }]
			: [{ line: flagged, at: erased + 0.05, kind: 'add' }]
	);

	const commit = 'git commit -m "Add the launch email"';
	const hook = `pre-commit: ${product.command} run --staged`;
	const first: TerminalLine[] = [
		{ at: 0.8, text: commit, kind: 'command', typed: 1 },
		{ at: 2, text: hook, kind: 'muted' },
		{ at: 2.25, text: 'Test brand-voice' },
		{ at: 2.5, text: 'emails/launch.md has been selected' },
		{
			at: 2.75,
			text: 'emails/launch.md  brand-voice/no-guarantees  Describe the typical result, or link the terms.',
			kind: 'fail'
		}
	];
	// The terminal starts clean for the second attempt, so the first run never crowds it.
	const second: TerminalLine[] = [
		{ at: retried, text: commit, kind: 'command', typed: 0.6 },
		{ at: 7.65, text: hook, kind: 'muted' },
		{ at: 7.8, text: '0 of 1 source(s) failed', kind: 'pass' },
		{ at: 7.95, text: '[main 8f3b1c2] Add the launch email' },
		{ at: 8.05, text: ` 1 file changed, ${length} insertions(+)` }
	];
	const lines = $derived(time < retried ? first : second);

	const entered = $derived(fade(time, 0, 0.4));
	const exit = $derived(1 - fade(time, duration - 0.3, duration));
	const alarm = $derived(
		fade(time, blocked, blocked + 0.25) * (1 - fade(time, fixing, fixing + 0.25))
	);
	const passed = $derived(fade(time, committed, committed + landing));
	// The idle label steps aside before a colored state arrives and returns once it has gone.
	const idle = $derived(
		1 -
			fade(time, blocked - 0.2, blocked) +
			fade(time, fixing + 0.25, fixing + 0.45) -
			fade(time, committed - 0.2, committed)
	);
</script>

<div class="scene" style:opacity={exit}>
	<Caption step={4} text="Now it reaches the work" {time} />

	<div class="content" style:opacity={entered} style:translate={`0 ${(1 - entered) * 24}px`}>
		<div class="editor">
			<Editor file="emails/launch.md" {code} {marks} {time} />
			<!-- Sits in the editor's tab bar, where an editor names who changed a file. -->
			<span class="author">
				<Icon name="smart_toy" filled />
				<span class="byline">written by your coding agent</span>
			</span>
		</div>

		<!-- The commit's state, big enough to read from across a room. -->
		<div class="status">
			<div class="state idle" style:opacity={idle}>
				<Icon name="commit" />
				<strong>Pre-commit hook</strong>
			</div>
			<div
				class="state alarm"
				style:opacity={alarm}
				style:scale={0.94 + 0.06 * fade(time, blocked, blocked + 0.3)}
			>
				<Icon name="block" filled />
				<strong>Commit blocked</strong>
				<code>exit 1</code>
			</div>
			<div
				class="state passed"
				style:opacity={passed}
				style:scale={0.94 + 0.06 * fade(time, committed, committed + landing)}
			>
				<Icon name="check_circle" filled />
				<strong>Committed</strong>
				<code>exit 0</code>
			</div>
		</div>

		<div class="terminal">
			<div class="ring alarm" style:opacity={alarm}></div>
			<div class="ring passed" style:opacity={passed}></div>
			<Terminal {lines} {time} />
		</div>
	</div>
</div>

<style>
	.scene,
	.content {
		position: absolute;
		inset: 0;
	}
	.editor {
		position: absolute;
		top: 200px;
		left: 96px;
		width: 1088px;
		height: 440px;
		--code-size: 32px;
	}
	/* Centered on the file tab's row, so the two read as one line of the tab bar. */
	.author {
		position: absolute;
		top: 40px;
		right: 0;
		display: flex;
		align-items: center;
		gap: 10px;
		height: 48px;
		padding-right: 28px;
		color: #9cdcfe;
		font-size: 34px;
	}
	.byline {
		font:
			500 24px / 1 var(--font-text),
			sans-serif;
		letter-spacing: -0.01em;
	}
	.status {
		position: absolute;
		top: 200px;
		left: 1208px;
		width: 616px;
		height: 440px;
		border-radius: 1rem;
		background: color-mix(in srgb, var(--color-foreground) 5%, var(--color-background));
		box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--color-foreground) 10%, transparent);
	}
	.state {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
		border-radius: 1rem;
		font-size: 112px;
	}
	.idle {
		color: var(--color-muted);
	}
	.state.alarm {
		background: var(--color-error);
		color: white;
	}
	.state.passed {
		background: var(--color-success);
		color: white;
	}
	strong {
		font:
			650 56px / 1.1 var(--font-text),
			sans-serif;
		letter-spacing: -0.03em;
	}
	code {
		padding: 4px 18px;
		border-radius: 999px;
		background: color-mix(in srgb, white 22%, transparent);
		font:
			500 32px / 1.4 var(--font-mono),
			monospace;
	}
	.terminal {
		position: absolute;
		top: 664px;
		left: 96px;
		width: 1728px;
		height: 344px;
		isolation: isolate;
		--code-size: 28px;
	}
	.ring {
		position: absolute;
		inset: -5px;
		z-index: -1;
		border-radius: calc(1rem + 5px);
	}
	.ring.alarm {
		background: var(--color-error);
	}
	.ring.passed {
		background: var(--color-success);
	}
</style>

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
	const blocked = 2.6;
	const fixed = 4;
	const cleared = 5.2;
	const committed = 7.2;

	// The route as the agent wrote it, and the two lines that replace its leak.
	const head = [
		"router.get('/:id', async (req, res) => {",
		'  try {',
		'    res.json(await findUser(req.params.id));',
		'  } catch (err) {'
	];
	const tail = ['  }', '});'];
	const indent = '    ';
	const leak = 'res.status(500).send(err.stack);';
	const logged = 'console.error(err.stack);';
	const answer = "res.status(500).send('Error');";

	// The fix: the leak is erased, then the logging line and the generic reply are typed in.
	const erased = 4.2;
	const code = $derived(
		time < erased
			? [...head, indent + typeChars(leak, 1 - progress(time, fixed, erased)), ...tail].join('\n')
			: [
					...head,
					indent + typeChars(logged, progress(time, 4.25, 4.65)),
					...(time >= 4.7 ? [indent + typeChars(answer, progress(time, 4.7, 5.1))] : []),
					...tail
				].join('\n')
	);
	const marks: EditorMark[] = $derived(
		time < erased
			? [{ line: 5, at: blocked, kind: 'remove' }]
			: [
					{ line: 5, at: 4.25, kind: 'add' },
					{ line: 6, at: 4.7, kind: 'add' }
				]
	);

	const commit = 'git commit -m "Handle user errors"';
	const hook = `pre-commit: ${product.command} run --staged`;
	const first: TerminalLine[] = [
		{ at: 0.5, text: commit, kind: 'command', typed: 1 },
		{ at: 1.65, text: hook, kind: 'muted' },
		{ at: 1.85, text: 'Scoping staged sources' },
		{ at: 2.05, text: 'src/routes/user.ts has been selected' },
		{ at: 2.25, text: 'src/routes/user.ts has failed no-stack-trace' },
		{
			at: 2.45,
			text: 'src/routes/user.ts  errors-hide-internals/no-stack-trace  Log the stack trace instead.',
			kind: 'fail'
		}
	];
	// The terminal starts clean for the second attempt, so the first run never crowds it.
	const second: TerminalLine[] = [
		{ at: 5.3, text: commit, kind: 'command', typed: 0.9 },
		{ at: 6.3, text: hook, kind: 'muted' },
		{ at: 6.5, text: 'src/routes/user.ts has been selected' },
		{ at: 6.75, text: '0 of 1 source(s) failed', kind: 'pass' },
		{ at: 6.95, text: '[main 4c1d2e7] Handle user errors' },
		{ at: 7.05, text: ' 1 file changed, 2 insertions(+), 1 deletion(-)' }
	];
	const lines = $derived(time < cleared ? first : second);

	const entered = $derived(fade(time, 0, 0.4));
	const shown = $derived(entered * (1 - fade(time, duration - 0.3, duration)));
	const alarm = $derived(
		fade(time, blocked, blocked + 0.25) * (1 - fade(time, fixed, fixed + 0.25))
	);
	const passed = $derived(fade(time, committed, committed + 0.25));
	// The idle label steps aside before a colored state arrives and returns once it has gone.
	const idle = $derived(
		1 -
			fade(time, blocked - 0.2, blocked) +
			fade(time, fixed + 0.25, fixed + 0.45) -
			fade(time, committed - 0.2, committed)
	);
</script>

<div class="caption" style:opacity={1 - fade(time, duration - 0.3, duration)}>
	<Caption step={4} text="Run it on every commit" {time} />
</div>

<div class="content" style:opacity={shown} style:translate={`0 ${(1 - entered) * 24}px`}>
	<div class="editor">
		<Editor file="src/routes/user.ts" {code} {marks} {time} />
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
			style:scale={0.94 + 0.06 * fade(time, committed, committed + 0.3)}
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

<style>
	.caption {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}
	.content {
		position: absolute;
		inset: 0;
	}
	.editor {
		position: absolute;
		top: 200px;
		left: 96px;
		width: 1060px;
		height: 418px;
		--code-size: 24px;
	}
	.status {
		position: absolute;
		top: 200px;
		left: 1180px;
		width: 644px;
		height: 418px;
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
		top: 634px;
		left: 96px;
		width: 1728px;
		height: 374px;
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

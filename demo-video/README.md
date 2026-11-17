# Demo video

A private SvelteKit app in the root Bun workspace. Uses the public `bref-ui` and `bref-ui-themes`
exports to play the 60-second silent product film at 1920×1080 and render it to the MP4 for the
root README.

```sh
bun install
bun run --cwd demo-video dev
```

The dev server uses port 5183. The player supports chapter seeking, Space to play or pause, and
arrow keys to seek five seconds. Reduced motion disables autoplay. Use `?t=12.5` to start paused at
a particular second. `?render` shows only the 1920×1080 stage and exposes
`window.__film = { duration, scenes, seek }` to the scripts; `?render&t=12.5` is the clean film
frame.

## Rendering

Requires Node.js 22+, Bun, FFmpeg with libx264, and Playwright Chromium.

```sh
cd demo-video
bunx playwright install chromium
bun run verify
bun run render
```

The silent export, `output/demo.mp4`, is 1920×1080, 30 fps, 60 seconds, H.264 with BT.709 4:2:0
color and fast-start metadata. Every frame seeks the timeline explicitly. Fonts are bundled
locally, so the film needs no network. `output/` is ignored.

```sh
# Smaller draft or a single scene:
bun run render --width 1280 --fps 24 --output output/draft.mp4
bun run render --from 34 --to 43 --output output/eval.mp4

# PNG frames from the running dev server, into output/shots/:
node scripts/shot.mjs --t 12.5 --t 30
```

`--width` takes a multiple of 32 and the height follows 16:9; `node scripts/render.mjs --help`
lists every option. Without `--url`, render and verify build the app and serve it with
`vite preview`, render on port 4175 and verify on 4177 (`--port` overrides either); with `--url`
they use that running server and start nothing. Each closes its browser and the server it started.

Verify reads the expected length and scenes from the film's own timeline, so it needs no edit when
the film changes. It prints one line per check: that the duration is the sum of the scenes, that
every scene appears in order with its own component and no placeholder, that seeking is
deterministic, that the last frame is not blank, and that the page reports no errors. Frames that
differ between two seeks are saved in `output/verify/`. Root `check` and `lint` also cover this
workspace.

## Storyboard

The film follows one business decision from the meeting to the commit. People make it once.
Agents write the work and never hear it. Written down once as a Test, it reaches every commit. One
example runs through every scene, the Test `brand-voice`, and every terminal line shown is real
output of the built CLI.

- 0:00–0:07, `decision`: marketing's decision on a card. No hype. No guarantees. Never blame the
  customer.
- 0:07–0:15, `drift`: an agent writes `content/pricing.md` and breaks all three. Decisions travel
  slowly; agents write fast.
- 0:15–0:23, `rule`, step 1: the decision written down once, as `TEST.md` in plain language under
  `.agents/tests/brand-voice/`.
- 0:23–0:34, `compile`, step 2: the `compile` command prints a prompt and calls no model. The
  coding agent returns `test.yaml`: one fuzzy rule as three narrow checks, each a local `grep` gate
  and one yes-or-no `decide` question.
- 0:34–0:43, `eval`, step 3: six one-line examples with expected outcomes, including near misses
  that both say "guarantee". All six match before the Test blocks anything.
- 0:43–0:54, `commit`, step 4: an agent's launch email promises a result. The pre-commit hook
  blocks it with one finding line. The fix goes through.
- 0:54–1:00, `cta`: the name, the tagline, the `init` command and the repository. The final frame
  is the poster.

## Composition and motion

`src/lib/timeline.ts` gives the seven scenes explicit durations, 60 seconds in total. Each scene is
one component, `src/lib/scenes/<id>.svelte`, that takes a single `time` prop and is a pure function
of it: no timers, transitions or CSS animations. That is what makes every frame reproducible by
seeking. The player finds scenes by file name and shows a placeholder for a missing one.

The shared pieces live in `src/lib/components/`: `stage`, the fixed 1920×1080 canvas, which also
switches off any library transition or animation inside it; `terminal` and `editor`; `caption`,
the chapter title docked top-left; and `kinetic`, a centered headline. `src/lib/motion.ts` and
`src/lib/timeline.ts` hold the progress, easing and typing helpers, `src/lib/syntax.ts` colors the
editor, and `src/lib/film.svelte.ts` is the one clock the player and the renderer share.

The root mounts one default `Theme` and the stage pins it to light. The terminal, the editor and
the closing command chip each wrap themselves in the VS Code theme from `bref-ui-themes`.

Motion is driven by scene time, one focal point at a time. Each scene fades out over its last 0.3
seconds, except the poster, so boundaries add no runtime. Captions carry the step number for steps
1 to 4. Every scene ends on one short line or final state that holds still for at least 2.5
seconds. Text types out only when watching it being written matters; otherwise it appears.

The product's name, command, config file name, tagline and repository live only in
`src/lib/product.ts`; renaming the product is one edit there.

## Delivery

The rendered MP4 is uploaded to GitHub and its URL pasted on its own line in the root README's "See
it in 60 seconds" section. The MP4 itself is never committed.

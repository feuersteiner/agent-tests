# benchmarks agent guide

Compares the `decision` models on labelled cases; see `README.md` for the method.

## Layout

- `.agents/tests/`: the dataset, ordinary agentests Tests. Sample data with deliberate violations: ESLint, Prettier and `tsc` skip it.
- `contenders.yaml`: the models compared, their prices and the shared threshold. `agentests.config.yaml` exists so the agentests CLI works here.
- `src/`: `dataset.ts` loads and checks the cases, `deciders.ts` builds the real and the fake decider, `tap.ts` reads usage from `fetch`, `run.ts` is the loop, `metrics.ts` the numbers, `report.ts` the Markdown, `files.ts` the run folder, `eslint-cases.ts` and `eslint-rules.ts` the linter tier.
- `cli/`: `run.ts`, `report.ts`, `dataset.ts`, `import-eslint.ts`; run from this folder through the `package.json` scripts.
- `tests/`: `bun test`, no model and no network.
- `results/`: one folder per run; `dry-run/` is Git-ignored.

## Rules

- Only the owner runs `bun run bench`: it calls paid models. Everything else here is free and safe.
- Never commit a dry run, and never write a number into a document that did not come from a committed run folder.
- One Test is one `decide` criterion with a glob `select`; one eval is one file labelled `pass` or `fail`. `bun run dataset` enforces it.
- Hand-tier ids start with `hand-`; every Test has a `benchmark.yaml`.
- Never run a model to choose or tune a case. After the first paid run, changing a criterion or a case starts a new dataset hash.
- Linter-tier folders are generated: change `src/eslint-rules.ts` and rerun `bun run import:eslint`, never edit them by hand.
- Import the package from `../core/index.ts`; change nothing in `core/` for the benchmark's sake.

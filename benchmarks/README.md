# Decision model benchmark

How well does a decision model answer one yes-or-no criterion about one file? This folder holds
the labelled cases, the runner and the report that compare the `decision` models agentests
supports: OpenAI `gpt-6-luna` and Jev by typesafe.ai.

No results are published yet. The owner runs the paid calls; everything here was built and tested
with a fake model.

## What is judged

One decision at a time: a file, a criterion, and the verdict a careful reviewer gives. Every
benchmark Test uses `decide` alone, with one assertion, and every eval holds one file. One eval is
therefore one model decision, and nothing else in the pipeline (`grep`, `reason`, the reasoning
model) can change the verdict.

| Metric            | The question it answers                | How it is measured                                                                      |
| ----------------- | -------------------------------------- | --------------------------------------------------------------------------------------- |
| Accuracy          | How often is the verdict right?        | Share of cases where the verdict matches the label, with a 95% interval                 |
| False blocks      | How often is a good commit stopped?    | Clean files the model flagged                                                           |
| Missed violations | How often does a bad file get through? | Violating files the model cleared                                                       |
| Flip rate         | Same file, same verdict?               | Each case is asked several times; the share of cases whose verdicts disagree            |
| Brier score       | Does its confidence mean anything?     | Mean squared gap between the probability and the label; lower is better                 |
| Latency           | How long does a commit wait?           | Milliseconds per decision (median, 95th percentile) and per full pass over the dataset  |
| Cost              | What does a run cost?                  | Reported token usage times the prices in `contenders.yaml`, per 1,000 decisions         |
| Threshold sweep   | Is 0.5 the right cut-off?              | Accuracy recomputed from the stored probabilities at every cut-off, with no extra calls |
| Head to head      | Is the gap more than chance?           | Cases only one model got right, and a sign test on them                                 |

## Dataset

229 cases in 28 Tests under `.agents/tests/`, half labelled pass and half fail. They are ordinary
agentests Tests, so `npx agentests validate` and `npx agentests eval` work from this folder. Each
Test's `benchmark.yaml` records its tier, category, source and licence.

| Tier     | Tests | Cases | What it is                                                                                |
| -------- | ----- | ----- | ----------------------------------------------------------------------------------------- |
| `hand`   | 17    | 107   | Near misses written for this benchmark across copy, docs, code, config and business rules |
| `linter` | 11    | 122   | ESLint's own rule tests: snippets its suite labels valid or invalid                       |

**Hand tier.** Each Test pairs files that look alike and differ in the one thing the rule is
about: a refund guarantee against a guaranteed result, an idempotency key made before the retry
loop against one made inside it, a 16% price cut against a 28% one given only as two prices. They
were written without running either model, so neither had its criteria tuned to it.

**Linter tier.** `bun run import:eslint <checkout>` reads ESLint's rule test files at a pinned
commit, as text, and keeps cases that set no rule options. `src/eslint-rules.ts` lists the rules,
the criterion written for each, and the chosen cases by hash. A case was kept only when ESLint's
label follows from the criterion as written; cases that turn on a parser detail the criterion does
not state were left out. ESLint is MIT-licensed; its licence is in `licences/ESLint.txt`.

## Run it

From the repository root, with `OPENAI_API_KEY` and `TYPESAFE_AI_API_KEY` in `.env`:

```sh
bun install
bun run bench
```

That asks both models every case five times, four at a time, and writes `results/<date>/`:

- `decisions.jsonl`: one line per decision, with its probability, latency and reported usage.
- `run.json`: the models, repeats, threshold, commit, and the hashes of the dataset and the prompt.
- `results.json`: every metric, overall and by tier, category and Test.
- `RESULTS.md`: the same as tables.

Options go after `--`: `--repeats 3`, `--concurrency 1`, `--contender jev`, `--test hand-`,
`--name first-run`. Before a paid run, set the prices in `contenders.yaml` from each provider's
price page; while they are null the report leaves cost out.

Without keys:

```sh
bun run bench:dry                                  # fake model, writes results/dry-run/ (Git-ignored)
bun run --cwd benchmarks dataset                   # checks the dataset's shape, calls no model
bun run --cwd benchmarks report results/<name>     # rebuilds the report from decisions.jsonl
```

## Rules of the comparison

Fixed before any paid run:

1. Both models get the same prompt, through the package's own decide engine, and the same 0.5
   threshold.
2. No criterion or case is changed to suit a model. Once the first paid run exists, a change to
   the dataset changes its hash, and results with different hashes are not compared.
3. Every run folder is committed whole, raw decisions included.
4. Results are published whichever model they favour.
5. The author of this benchmark has no affiliation with typesafe.ai or OpenAI.

## Limits

- 229 cases resolve large gaps, not small ones: the interval on accuracy is several points wide,
  and the sign test says whether a gap is more than chance.
- ESLint's tests are public and may be in either model's training data. The hand tier is not.
- The hand tier has one author. A second reviewer's labels would make it stronger.
- `jev-latest` is a moving name. `run.json` records the date; pin a dated model id if one exists.
- Latency includes the SDK's retries and depends on where and when the run happens. Contenders
  take turns within each repeat so that a slow hour does not land on one of them.
- Token usage is read from the provider's HTTP response, because the decide engine returns only a
  score. A provider that reports no usage shows as "not reported".
- The existing fixture in `core/tests/models/` is not part of this benchmark: its criteria were
  tuned until `gpt-6-luna` passed them.

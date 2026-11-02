# Text formatting

`formatText(result)` calls `formatFindings`, `formatWarnings`, `formatSkipped` and
`summarizeRun`, then joins their output with newlines. `formatFindings` uses the internal
`formatFinding` helper in `utils.ts`. Rendering preserves input order and includes no terminal
escape codes. Callers import `formatText` through this stage entry or the results barrel.

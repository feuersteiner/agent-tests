# Results

Create a shared run result with `createRunResult`, then render it with `formatText` or `formatJson`.
Error findings exit 1, operational failures exit 2, and warning-only runs exit 0.
Every finding includes its test, check, execution level, file, line and proposed fix.

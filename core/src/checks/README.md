# Checks

Evaluate selected file content through fast patterns, smart decisions and deep review.

`evaluateCheck` evaluates one check and `evaluateChecks` combines a test's checks. Definite fast matches fail immediately. Smart passes stop; smart violations and uncertainty proceed to deep when configured. Final uncertainty creates a warning, with `requiresReview` when requested. Missing models skip unresolved checks while retaining model-free findings.

`runTests` discovers tests, applies the selected Git or path scope and evaluates triggers before checks. It returns the shared result model: error findings exit 1, runtime/configuration failures exit 2, otherwise 0. It never edits the inspected repository. `formatGitHubAnnotations` renders escaped CI annotations without logging them.

Stage folders expose only their entry functions; supporting files are private implementation steps. `askModel` validates model decisions and sanitizes failures, while `smartDecision` applies the configured confidence bounds. `runTests` resolves the repository root to its canonical path before discovery, configuration and trigger evaluation.

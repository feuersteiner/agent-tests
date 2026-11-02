# Evaluate one check

`evaluateCheck` calls the fast stage, then `completeFast` for definite hits or fast-only results. Otherwise it returns `unavailable` when no model exists, or calls `evaluateModel`. That step uses `askModel` and `smartDecision`, then `completeModel`; smart passes stop, while unresolved or failed smart decisions proceed to deep when configured. Regex errors and sanitized model failures reject. Only model steps can perform network requests; tests inject offline mocks.

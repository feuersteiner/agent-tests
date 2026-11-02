# Evaluate triggers

`evaluateTriggers` normalizes a single trigger to ordered alternatives, then calls
`evaluateAlternative` for each until one accepts. An accepted alternative resolves any
warnings from earlier unresolved alternatives; otherwise warnings are deduplicated.

`evaluateAlternative` calls `evaluateFilter` for each path/content filter in written order
and stops at the first rejected or unresolved result. `evaluateFilter` preserves nested
match/ask order. Invalid content regexes and sanitized model failures propagate to callers.
This stage uses caller-provided paths and text and performs no filesystem reads or writes.

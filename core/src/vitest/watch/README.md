# Watch hosted targets

`watchProject()` creates serial refresh state, obtains a change handler from
`createChangeHandler()` and calls `subscribeWatch()` for change/add/unlink events.
The handler ignores paths outside the repository and dependency/Git directories.

`refreshProject()` recollects groups and republishes changed data before rewriting
the canonical generated entry. Configuration/environment changes force a rewrite;
unchanged groups preserve cached worker answers. `failRefresh()` publishes one
failing collection test until a successful refresh recovers it.

The returned release calls `cleanupWatch()` to detach all three event listeners
and drain queued refreshes before temporary files are removed. Refresh failures
are surfaced through hosted tests; filesystem failures while reporting an error
or draining cleanup propagate to the caller.

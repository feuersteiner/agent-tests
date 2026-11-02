# Cache hosted model decisions

`createCachedModel()` retains unavailable models as unavailable and wraps a
configured model with a process-local pending-request map. Its `decide()` delegates
to `decideCachedRequest()`, which fingerprints the exact request and provider
identity and shares an existing pending answer.

`readOrDecide()` reads a valid disk answer or calls the model, writes a private
unique temporary answer and atomically renames it into place. Missing or invalid
JSON cache files are recomputed. Model and other filesystem failures propagate;
rejected requests are evicted from the pending map so a later call can retry.

Provider/credential identity is supplied by `modelIdentity()` as an opaque hash.
Cached answers are shared across workers without serializing credentials or model
instances into Vitest's provided context.

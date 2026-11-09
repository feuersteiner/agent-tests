# Engines

Engines provide matching and AI operations shared by selection and checks.

`Engines` owns `glob`, `grep`, `decision`, and `reasoning`. `GlobEngine` matches POSIX paths and prunes unrelated traversal; terminal slashes require directories. `GrepEngine` matches file content and rejects directory sources.

`DecisionalAiEngine` and `ReasoningAiEngine` extend `AIEngine`. Their `run` scores passing conditions in `[0, 1]`; `explain` preserves that score and grounds evidence in exact input quotes. Provider SDKs, prompts, thresholds, and required credential handling retain their behavior.

`sourceInput` supplies file text or serialized directory snapshots. `EngineSet` exposes the operations required by selection and checks so callers can inject scorers. Traversal belongs to the runner. Directory predicates remain deferred.

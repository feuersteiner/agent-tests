# GitHub annotations

`formatGitHubAnnotations` maps findings through `formatAnnotation` and joins workflow commands with newlines. The rendering step uses private escaping utilities for data and properties. The returned string preserves locations, severity and fixes without writing or logging.

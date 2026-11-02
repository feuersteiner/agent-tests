# Fast checks

`evaluateFast` calls `scanPatterns` for definite patterns and weak hints. The scanner keeps every unique text/offset pair in source order, including empty matches. Invalid regular expressions throw; no model or filesystem calls occur.

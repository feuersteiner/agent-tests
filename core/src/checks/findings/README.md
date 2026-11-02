# Findings

`createFindings` calls `resolveLocations`, then `renderFindings`. Exact pattern offsets take priority; model evidence uses a valid hinted line, a text search or a file-start fallback. Rendering calls the private `locate` utility for one-based positions and carries messages, fixes and review flags into findings. No I/O occurs.

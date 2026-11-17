# Error responses hide internals

The error responses an HTTP route sends to clients never contain internal details: no stack trace, SQL query, server file path, internal hostname, or credential. Logging those details on the server is fine.

Applies to the Express route handlers under `src/routes/`.

Exceptions: code outside `src/routes/`, which never answers a client directly.

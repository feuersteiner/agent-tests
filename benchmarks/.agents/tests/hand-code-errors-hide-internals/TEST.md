# Error responses hide internals

Responses sent to the client from code under `src/` never include a stack trace, a raw database error message or a server file path. Those go to the server log.

# No focused tests

Test files never focus tests with `.only`, such as `describe.only`, `it.only`, or `test.only`, which silently skips the rest of the suite.

It applies to the test files in the TypeScript and JavaScript code, wherever they sit: next to the code under `src/` or under `tests/`.

Exceptions: production code, where `.only(` is an ordinary method name, such as a query builder's, and a test that calls such a method without focusing a test.

# SQL values are parameters

Code under `src/` never builds a SQL query by putting a runtime value into the query text. Values travel as query parameters.

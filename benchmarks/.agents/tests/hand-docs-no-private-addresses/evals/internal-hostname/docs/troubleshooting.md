# Troubleshooting

## The agent cannot reach the database

Check that the agent resolves the primary:

```sh
dig db-primary.prod.internal
```

If it does not, restart the resolver.

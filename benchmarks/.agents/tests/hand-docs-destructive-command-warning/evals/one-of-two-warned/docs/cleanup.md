# Cleaning up

## Remove a project

```sh
relay project delete web
```

> **Warning:** this is permanent and cannot be undone.

## Remove old backups

```sh
relay backup purge --older-than 7d
```

Purged backups are erased from every region.

# Backups

Relay takes a backup every night and keeps it for 30 days.

```sh
relay backup list
relay backup export 2026-03-14 --out ./march.tar
```

Exporting copies the backup to your machine. The copy on our side stays
where it is.

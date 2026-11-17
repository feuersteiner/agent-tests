# Changelog

## [2.3.1] - 2026-10-20

### Fixed

- `client.query()` closes idle sockets after the configured delay.

## [2.3.0] - 2026-09-09

### Removed

- The deprecated `client.connectSync()` method. Call `await client.connect()` instead.

## [2.2.4] - 2026-08-27

### Fixed

- Connection errors keep their original cause.

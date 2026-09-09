# Changelog

## 1.5.0 - 2026-09-09

### Fixed

- Match offline signing, activation, bulk-key, deactivation, floating renewal, and customer contracts to the current API.
- Send detailed license lookup credentials through `x-license-key` rather than request URLs.
- Preserve actionable messages from nested API error envelopes.

### Added

- Deterministic HTTP contract tests and live end-to-end API validation.

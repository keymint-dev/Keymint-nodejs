# Changelog

## 1.6.0 - 2026-10-26

### Added

- `expirationDate` on `ActivateKeyResponse` and `FloatingCheckoutResponse`: the license expiry as an ISO 8601 string, or `null` when the license never expires. Typed as optional (`expirationDate?: string | null`) for compatibility with older servers. On checkout it is separate from `expiresAt`, the floating seat lease.

## 1.5.0 - 2026-09-09

### Fixed

- Match offline signing, activation, bulk-key, deactivation, floating renewal, and customer contracts to the current API.
- Send detailed license lookup credentials through `x-license-key` rather than request URLs.
- Preserve actionable messages from nested API error envelopes.

### Added

- Deterministic HTTP contract tests and live end-to-end API validation.

# Changelog

## Unreleased

### Security

- Lockfile: `follow-redirects` 1.16.0 -> 1.16.1 (GHSA-q3jh-wrc6-jgq8, GHSA-8r9p-f939-6h3c), plus dev-only `brace-expansion` and `js-yaml` fixes. No `axios` release requires a fixed `follow-redirects` yet, so existing installs should run `npm update follow-redirects`.

## 1.7.0 - 2026-10-26

### Added

- `verifyOfflineLicense(license, options)` (also `KeyMint.verifyOfflineLicense`): verifies a signed offline license (`.lic` file or bare token) locally with `node:crypto`, no new dependencies. Requires the trusted public keys, `productId` and `machineCode`; optional `now` and `clockSkewSeconds` (default 60, max 3600). Returns `OfflineLicense`; failures throw `OfflineLicenseError` with a `code` (`malformed`, `unsupported_algorithm`, `unknown_key`, `bad_signature`, `wrong_type`, `wrong_product`, `wrong_machine`, `expired`). Invalid options throw `TypeError`/`RangeError`.
- Tests against the shared Keymint offline-license test vectors (34 cases).
- `deleteKey(params)`: permanently deletes a license key via `DELETE /key` (use `blockKey` to stop it reversibly).

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

# Changelog

## Unreleased

### Added

- `getOrCreateInstallationId` accepts `{ requirePersisted: true }`, either as a second argument after `storagePath` or as a single options object with `storagePath`. It throws the new `InstallationIdError` (with `path`) when the ID can't be saved and read back, or an existing file can't be read. Recommended for desktop apps that activate devices. The default is `false` and the return type is unchanged.

### Fixed

- `getOrCreateInstallationId` no longer fails silently when it can't save the ID. By default it still returns an unsaved ID, and now emits one `KeymintInstallationIdWarning` per process (`process.emitWarning`, code `KEYMINT_INSTALLATION_ID_NOT_SAVED`), because the next launch will get a different ID and use another activation slot.
- The storage directory is found with `path.dirname`, so Windows paths with backslashes are created correctly.

## 1.8.0 - 2026-11-11

### Added

- `KeyMintApiError.errorCode`: the stable string error code the API now sends with every error (for example `license_invalid_or_forbidden`, `rate_limited`). Branch on it instead of `message`. Absent when the response has none; existing fields are unchanged.

- `updateKey`: `expiryDate` accepts `null` (or `""`) to remove a license's expiry; omitting it keeps the current one. `null` is sent as-is in the request body.
- `maxActivations` on `createKey` and `updateKey` accepts a whole number 0–1,000,000 (number or digit string), `"unlimited"` or `null` (unlimited), matching the API.

### Fixed

- `createCustomer`: `email` is optional, as in the API (`name` is required, 3–255 characters).
- Docs: methods reject with `KeyMintApiError` (branch on `errorCode`); `floatingCheckout`, `floatingHeartbeat` and `floatingCheckin` ignore `Idempotency-Key`, so nothing is replayed for them; `getOrCreateInstallationId` returns an unsaved ID when it can't write its file.

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

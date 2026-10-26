# Keymint Node.js

A professional, production-ready SDK for integrating with the Keymint API in Node.js/TypeScript. Provides robust, async-first access to all major Keymint features, with strong typing and modern error handling.

## Features
- **Async/await**: All API calls are asynchronous.
- **TypeScript-first**: Strongly typed request and response models for all endpoints.
- **Consistent error handling**: All API errors are returned as structured objects.
- **Machine Identity**: Built-in utilities for hardware fingerprinting and stable installation IDs.

## Installation
Add the SDK to your project:

```bash
npm install keymint
```

## Usage

```typescript
import { KeyMint } from 'keymint';

const apiKey = process.env.KEYMINT_API_KEY;
const productId = process.env.KEYMINT_PRODUCT_ID;

if (!apiKey || !productId) {
  throw new Error('Please set the KEYMINT_API_KEY and KEYMINT_PRODUCT_ID environment variables.');
}

const sdk = new KeyMint(apiKey);

// 1. Get a stable, unique ID for this machine
const hostId = KeyMint.getOrCreateInstallationId();

// 2. Create a key authorized only for this machine
const result = await sdk.createKey({ 
  productId,
  allowedHosts: [hostId] 
});

if (result && result.key) {
  console.log(`Created Key: ${result.key}`);
}
```

## Machine Identity
Keymint provides utilities to uniquely identify machines for node-locking:

- `KeyMint.getOrCreateInstallationId()`: **Recommended.** Generates a stable UUID anchored to hardware and persists it to `~/.keymint/installation-id`.
- `KeyMint.getMachineId()`: Generates a SHA-256 fingerprint based on BIOS UUID, OS machine ID, and MAC address.

## API Methods

### License Key Management

| Method          | Description                                     |
|-----------------|-------------------------------------------------|
| `createKey`     | Creates a new license key.                      |
| `activateKey`   | Activates a license key for a device.           |
| `deactivateKey` | Deactivates a device from a license key.        |
| `getKey`        | Retrieves detailed information about a key.     |
| `updateKey`     | Updates an existing license key.                |
| `blockKey`      | Blocks a license key.                           |
| `unblockKey`    | Unblocks a previously blocked license key.      |
| `deleteKey`     | Permanently deletes a license key (use `blockKey` to stop it reversibly). |
| `signKey`       | Signs a key for offline validation using an admin API key.|
| `floatingCheckout` | Checks out a floating license seat.           |
| `floatingHeartbeat`| Sends a heartbeat to keep a session alive.    |
| `floatingCheckin`  | Checks in a session, releasing the seat.      |
| `verifyOfflineLicense` | Verifies a signed offline license locally, without network access. Standalone export, also `KeyMint.verifyOfflineLicense`. |

### Customer Management

| Method                | Description                                      |
|-----------------------|--------------------------------------------------|
| `createCustomer`      | Creates a new customer.                          |
| `getAllCustomers`     | Retrieves all customers.                         |
| `getCustomerById`     | Gets a specific customer by ID.                  |
| `getCustomerWithKeys` | Gets a customer along with their license keys.   |
| `updateCustomer`      | Updates an existing customer's information.      |
| `toggleCustomerStatus`| Toggles a customer's active status.              |
| `deleteCustomer`      | Permanently deletes a customer and their keys.   |

### Webhook Verification

| Method                  | Description                                      |
|-------------------------|--------------------------------------------------|
| `verifyWebhookSignature`| Verifies the signature of a webhook request payload. |

## License Expiry

`activateKey` and `floatingCheckout` return `expirationDate`: when the license expires, as an ISO 8601 string, or `null` if it never expires. On `floatingCheckout` it is separate from `expiresAt`, which is the floating seat lease. The field is optional in the types because older API servers may omit it.

```typescript
const res = await sdk.activateKey({ productId, licenseKey, hostId });

if (res.expirationDate) {
  const daysLeft = Math.max(0, Math.ceil((new Date(res.expirationDate).getTime() - Date.now()) / 86_400_000));
  console.log(`License expires on ${res.expirationDate} (${daysLeft} days left)`);
} else if (res.expirationDate === null) {
  console.log('License never expires');
}

// Store the last value you received (e.g. in your app's settings).
// `undefined` means an older server didn't send the field, so keep the previous value.
if (res.expirationDate !== undefined) saveLastExpirationDate(res.expirationDate);
```

Store the last `expirationDate` your app received. An expired license fails activation with the same generic error as an invalid key, so the stored date is what lets your app tell the user their license expired on that date instead of calling the key invalid.

## Offline Licenses

An offline license is a `.lic` file holding an Ed25519-signed token bound to one product and one machine. Your app verifies it locally with `verifyOfflineLicense`, with no network access.

1. **Get the `.lic` file.** Download it from the dashboard (Offline License) or create it with `signKey` (admin API key) and ship `result.file` to the machine. `hostId` there is the machine code the license is bound to.
2. **Bundle your public key.** Copy the PEM from **Developer → Public Keys** in the dashboard into your app. It is a public key, so it is safe to ship. Never bundle a private key; the verifier rejects anything that isn't an Ed25519 public key PEM.
3. **Verify** with the product ID and this machine's code:

```typescript
import { readFileSync } from 'fs';
import { KeyMint, verifyOfflineLicense, OfflineLicenseError } from 'keymint';

const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEA...
-----END PUBLIC KEY-----`;

try {
  const license = verifyOfflineLicense(readFileSync('license.lic', 'utf8'), {
    publicKeys: [PUBLIC_KEY],
    productId: 'prod_123',                          // required
    machineCode: KeyMint.getOrCreateInstallationId(), // the hostId the file was signed for
    // now: new Date(),       // optional, see clock rollback below
    // clockSkewSeconds: 60,  // optional leeway on expiry, 0..3600, default 60
  });
  console.log(`Licensed until ${license.expiresAt.toISOString()}`);
} catch (error) {
  if (!(error instanceof OfflineLicenseError)) throw error; // bad options are a programming error
  switch (error.code) {
    case 'expired':       /* ask the user to renew / re-sign the file */ break;
    case 'wrong_machine': /* the file was issued for another machine */ break;
    case 'wrong_product': /* the file is for a different product */ break;
    case 'malformed':
    case 'unsupported_algorithm':
    case 'unknown_key':
    case 'bad_signature':
    case 'wrong_type':    /* not a genuine Keymint offline license for this app */ break;
  }
}
```

`verifyOfflineLicense` is synchronous. It accepts the `.lic` file contents or the bare token, and returns `{ licenseKey, productId, machineCode, keyId, issuedAt, expiresAt }` (`issuedAt` is a `Date` or `null`, `expiresAt` a `Date`). On failure it throws `OfflineLicenseError` whose `code` is one of:

| Code | Meaning |
|---|---|
| `malformed` | Not a `.lic` file or token, or required claims (`exp`, `sub`) are missing. |
| `unsupported_algorithm` | The token isn't signed with EdDSA (e.g. `none`, `HS256`). |
| `unknown_key` | Signed by a key that isn't in `publicKeys`. |
| `bad_signature` | The signature doesn't match: the file was altered or forged. |
| `wrong_type` | The token isn't an offline license. |
| `wrong_product` | The license is for another product. |
| `wrong_machine` | The license is for another machine. |
| `expired` | Past `expiresAt` plus `clockSkewSeconds`. |

Error messages never contain the license key. Invalid options (no public keys, a key that isn't an Ed25519 SPKI PEM, empty `productId` or `machineCode`, `clockSkewSeconds` outside 0..3600, an invalid `now`) throw `TypeError` or `RangeError` instead.

**Why `productId` is required.** One signing key covers all of your organization's products, so the signature alone doesn't say which product a file unlocks. Without the product check, a license for a cheap product would unlock an expensive one.

**Clock rollback.** An offline app can't tell on its own if the user set the clock back. Store the latest time you trust (for example the last successful verification or online check) and pass `now: new Date(Math.max(Date.now(), lastTrustedTime))`.

**Key rotation.** `publicKeys` accepts several PEMs, so you can ship the old and new keys side by side during a rotation.

## Idempotency

All mutating SDK calls (such as creating keys, activations, customer management, etc.) support idempotency keys to safely retry requests in case of network drops. Pass a unique key (recommended: UUID v4) as the optional request options:

```typescript
const result = await sdk.createKey({ 
  productId,
}, {
  idempotencyKey: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
});
```

## License
MIT

## Support
For help, see [Keymint API docs](https://docs.keymint.dev) or open an issue.

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
| `blockKey`      | Blocks a license key.                           |
| `unblockKey`    | Unblocks a previously blocked license key.      |
| `floatingCheckout` | Checks out a floating license seat.           |
| `floatingHeartbeat`| Sends a heartbeat to keep a session alive.    |
| `floatingCheckin`  | Checks in a session, releasing the seat.      |

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

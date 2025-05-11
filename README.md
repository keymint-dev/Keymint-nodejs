# KeyMint SDK

A TypeScript SDK for interacting with the KeyMint API, simplifying license key management for your applications.

## Features

- Create new license keys.
- Activate license keys for specific devices.
- Deactivate devices associated with a license key.
- Retrieve detailed information about a license key.
- Block license keys to prevent further activations.
- Unblock previously blocked license keys.
- Typed requests and responses for better developer experience.
- Standardized error handling.

## Installation

```bash
npm install keymint-nodejs
# or
yarn add keymint-nodejs
```

## Important Note on Examples and Tests

**Please be aware that any access tokens, product IDs, license keys, or other specific identifiers visible in code examples, tests, or other parts of this repository are for illustrative and testing purposes only. They are not live credentials and have been invalidated or are placeholders. You must use your own valid credentials and identifiers from your KeyMint account when using this SDK.**

## Usage

First, initialize the SDK with your access token:

```typescript
import { KeyMintSDK } from "keymint-nodejs";

async function main() {
  const accessToken = process.env.KEYMINT_ACCESS_TOKEN;
  if (!accessToken) {
    console.error("Please set the KEYMINT_ACCESS_TOKEN environment variable.");
    return;
  }

  // Optionally, provide a custom base URL if not using the default KeyMint API endpoint
  // const sdk = new KeyMintSDK(accessToken, "https://your-custom-api.example.com");
  const sdk = new KeyMintSDK(accessToken);

  // ... use SDK methods
}

main();
```

## API Methods

All methods are asynchronous and return a Promise.

### `createKey`

Creates a new license key.

```typescript
try {
  const params = {
    productId: "your_product_id",
    // Optional parameters:
    // maxActivations: "5", // String representation of a number
    // expiryDate: "2025-12-31T23:59:59Z", // ISO 8601 date string
    // customerId: "cust_existing_123",
    // newCustomer: { name: "New Customer Name", email: "new@example.com" },
    // metadata: { custom_field: "custom_value" }
  };
  const response = await sdk.createKey(params);
  console.log("Key created:", response.key); // { code: 0, key: "lk_xxxx..." }
} catch (error) {
  console.error("Error creating key:", error);
}
```

### `activateKey`

Activates a license key for a device.

```typescript
try {
  const params = {
    productId: "your_product_id",
    licenseKey: "lk_xxxx-xxxxx-xxxxx-xxxxx",
    // Optional parameters:
    // hostId: "unique_device_id_123",
    // deviceTag: "User's MacBook Pro"
  };
  const response = await sdk.activateKey(params);
  console.log("Key activated:", response.message); // { code: 0, message: "License valid", ... }
} catch (error) {
  console.error("Error activating key:", error);
}
```

### `deactivateKey`

Deactivates a device associated with a license key. If `hostId` is omitted, all devices for that key are deactivated.

```typescript
try {
  const params = {
    productId: "your_product_id",
    licenseKey: "lk_xxxx-xxxxx-xxxxx-xxxxx",
    // Optional:
    // hostId: "unique_device_id_123"
  };
  const response = await sdk.deactivateKey(params);
  console.log("Key deactivated:", response.message); // { message: "Device deactivated", code: 0 }
} catch (error) {
  console.error("Error deactivating key:", error);
}
```

### `getKey`

Retrieves detailed information about a specific license key.

```typescript
try {
  const params = {
    productId: "your_product_id",
    licenseKey: "lk_xxxx-xxxxx-xxxxx-xxxxx",
  };
  const response = await sdk.getKey(params);
  console.log("License details:", response.data.license);
  // response.data also contains optional 'customer' details
  // { code: 0, data: { license: { ... }, customer?: { ... } } }
} catch (error) {
  console.error("Error getting key details:", error);
}
```

### `blockKey`

Blocks a license key, preventing further activations.

```typescript
try {
  const params = {
    productId: "your_product_id",
    licenseKey: "lk_xxxx-xxxxx-xxxxx-xxxxx",
  };
  const response = await sdk.blockKey(params);
  console.log("Key blocked:", response.message); // { message: "Key blocked", code: 0 }
} catch (error) {
  console.error("Error blocking key:", error);
}
```

### `unblockKey`

Unblocks a previously blocked license key.

```typescript
try {
  const params = {
    productId: "your_product_id",
    licenseKey: "lk_xxxx-xxxxx-xxxxx-xxxxx",
  };
  const response = await sdk.unblockKey(params);
  console.log("Key unblocked:", response.message); // { message: "Key unblocked", code: 0 }
} catch (error) {
  console.error("Error unblocking key:", error);
}
```

## Error Handling

The SDK methods throw an error object if the API call fails or an unexpected issue occurs. The error object typically includes `message`, `code` (API specific or -1 for generic errors), and `status` (HTTP status code).

```typescript
// Example error structure:
// {
//   message: "Invalid license key",
//   code: 1,
//   status: 404
// }
```

## Development

1.  Clone the repository.
2.  Install dependencies: `npm install`
3.  Build the SDK: `npm run build`

## License

This SDK is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## API Reference

Provides detailed information about the SDK's constructor and methods.

### `new KeyMintSDK(accessToken: string, baseUrl?: string)`

Initializes a new instance of the KeyMintSDK.

- `accessToken` (string, required): Your KeyMint API access token. This token will be used in the `Authorization` header for all API requests (e.g., `Bearer <accessToken>`).
- `baseUrl` (string, optional): The base URL for the KeyMint API. If not provided, it defaults to `https://api.keymint.dev`.

### `async sdk.createKey(params: CreateKeyParams): Promise<CreateKeyResponse>`

Creates a new license key for a given product.

- `params` ([`CreateKeyParams`](#createkeyparams)): An object containing:
  - `productId` (string, required): The ID of the product for which to create the key.
  - `maxActivations` (string, optional): Maximum number of times this key can be activated (e.g., "5").
  - `expiryDate` (string, optional): The expiration date of the key in ISO 8601 format (e.g., "2025-12-31T23:59:59Z").
  - `customerId` (string, optional): The ID of an existing customer to associate with this key.
  - `newCustomer` ([`NewCustomer`](#newcustomer), optional): An object to create and associate a new customer with this key.
    - `name` (string, required): Name of the new customer.
    - `email` (string, optional): Email of the new customer.
  - `metadata` (object, optional): A flexible object to store any custom key-value pairs.
- Returns: A `Promise` that resolves to a [`CreateKeyResponse`](#createkeyresponse) object containing the `code` and the new `key` string.
- Throws: `KeyMintApiError` if the API call fails (e.g., product not found, invalid parameters).

### `async sdk.activateKey(params: ActivateKeyParams): Promise<ActivateKeyResponse>`

Activates a license key for a specific device (host). This typically consumes one activation from the key unless the key has unlimited activations or is being reactivated on the same host ID for which it was previously activated.

- `params` ([`ActivateKeyParams`](#activatekeyparams)): An object containing:
  - `productId` (string, required): The ID of the product.
  - `licenseKey` (string, required): The license key to activate.
  - `hostId` (string, optional): A unique identifier for the host machine or device. Providing a consistent `hostId` is crucial for tracking activations per device and for deactivation.
  - `deviceTag` (string, optional): A user-friendly name or tag for the device (e.g., "User's MacBook Pro").
- Returns: A `Promise` that resolves to an [`ActivateKeyResponse`](#activatekeyresponse) object, often containing a `message`, `code`, and potentially details like `licensee_name` and `licensee_email`.
- Throws: `KeyMintApiError` if activation fails (e.g., key invalid, max activations reached, key blocked).

### `async sdk.deactivateKey(params: DeactivateKeyParams): Promise<DeactivateKeyResponse>`

Deactivates one or all host IDs associated with a license key. If `hostId` is provided, only that specific host is deactivated. If `hostId` is omitted, all activations for the key are removed (global deactivation).

- `params` ([`DeactivateKeyParams`](#deactivatekeyparams)): An object containing:
  - `productId` (string, required): The ID of the product.
  - `licenseKey` (string, required): The license key.
  - `hostId` (string, optional): The unique identifier of the host to deactivate. If omitted, all hosts are deactivated.
- Returns: A `Promise` that resolves to a [`DeactivateKeyResponse`](#deactivatekeyresponse) object with a `message` and `code` indicating success.
- Throws: `KeyMintApiError` if deactivation fails (e.g., key not found).

### `async sdk.getKey(params: GetKeyParams): Promise<GetKeyResponse>`

Retrieves detailed information about a specific license key, including its status, activation records, and associated customer data.

- `params` ([`GetKeyParams`](#getkeyparams)): An object containing:
  - `productId` (string, required): The ID of the product.
  - `licenseKey` (string, required): The license key to retrieve details for.
- Returns: A `Promise` that resolves to a [`GetKeyResponse`](#getkeyresponse) object containing detailed `data` about the license and customer.
- Throws: `KeyMintApiError` if the API call fails (e.g., key not found).

### `async sdk.blockKey(params: BlockKeyParams): Promise<BlockKeyResponse>`

Blocks a license key, preventing further activations or validations.

- `params` ([`BlockKeyParams`](#blockkeyparams)): An object containing:
  - `productId` (string, required): The ID of the product.
  - `licenseKey` (string, required): The license key to block.
- Returns: A `Promise` that resolves to a [`BlockKeyResponse`](#blockkeyresponse) object with a `message` and `code` indicating success.
- Throws: `KeyMintApiError` if blocking fails (e.g., key not found).

### `async sdk.unblockKey(params: UnblockKeyParams): Promise<UnblockKeyResponse>`

Unblocks a previously blocked license key, allowing it to be activated again.

- `params` ([`UnblockKeyParams`](#unblockkeyparams)): An object containing:
  - `productId` (string, required): The ID of the product.
  - `licenseKey` (string, required): The license key to unblock.
- Returns: A `Promise` that resolves to an [`UnblockKeyResponse`](#unblockkeyresponse) object with a `message` and `code` indicating success.
- Throws: `KeyMintApiError` if unblocking fails (e.g., key not found, key not currently blocked).

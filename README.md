# KeyMint NodeJS SDK

Welcome to the official KeyMint SDK for NodeJS! This library provides a simple and convenient way to interact with the KeyMint API, allowing you to manage license keys for your applications with ease.

## ✨ Features

*   **Simple & Intuitive**: A clean and modern API that is easy to learn and use.
*   **TypeScript Ready**: Written in TypeScript to provide type safety and a better developer experience.
*   **Comprehensive**: Covers all the essential KeyMint API endpoints.
*   **Well-Documented**: Clear and concise documentation with plenty of examples.
*   **Error Handling**: Standardized error handling to make debugging a breeze.

## 🚀 Quick Start

Here's a complete example of how to use the SDK to create and activate a license key:

```typescript
import { KeyMintSDK } from 'keymint-nodejs';

async function main() {
  const accessToken = process.env.KEYMINT_ACCESS_TOKEN;
  if (!accessToken) {
    console.error('Please set the KEYMINT_ACCESS_TOKEN environment variable.');
    return;
  }

  const sdk = new KeyMintSDK(accessToken);

  try {
    // 1. Create a new license key
    const createResponse = await sdk.createKey({
      productId: 'YOUR_PRODUCT_ID',
    });
    const licenseKey = createResponse.key;
    console.log('Key created:', licenseKey);

    // 2. Activate the license key
    const activateResponse = await sdk.activateKey({
      productId: 'YOUR_PRODUCT_ID',
      licenseKey: licenseKey,
      hostId: 'UNIQUE_DEVICE_ID',
    });
    console.log('Key activated:', activateResponse.message);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

main();
```

## 📦 Installation

```bash
npm install keymint-nodejs
```

or with Yarn:

```bash
yarn add keymint-nodejs
```

## 🛠️ Usage

### Initialization

First, import the `KeyMintSDK` and initialize it with your access token. You can find your access token in your [KeyMint dashboard](https://app.keymint.dev/dashboard/developer/access-tokens).

```typescript
import { KeyMintSDK } from 'keymint-nodejs';

const accessToken = 'YOUR_ACCESS_TOKEN';
const sdk = new KeyMintSDK(accessToken);
```

### API Methods

All methods are asynchronous and return a `Promise`.

| Method          | Description                                     |
| --------------- | ----------------------------------------------- |
| `createKey`     | Creates a new license key.                      |
| `activateKey`   | Activates a license key for a device.           |
| `deactivateKey` | Deactivates a device from a license key.        |
| `getKey`        | Retrieves detailed information about a key.     |
| `blockKey`      | Blocks a license key.                           |
| `unblockKey`    | Unblocks a previously blocked license key.      |

For more detailed information about the API methods and their parameters, please refer to the [API Reference](#api-reference) section below.

## 🚨 Error Handling

If an API call fails, the SDK will throw a `KeyMintApiError` object. This object contains a `message`, `code`, and `status` property that you can use to handle the error.

```typescript
try {
  // ...
} catch (error) {
  if (error instanceof KeyMintApiError) {
    console.error('API Error:', error.message);
    console.error('Status:', error.status);
    console.error('Code:', error.code);
  } else {
    console.error('An unexpected error occurred:', error);
  }
}
```

## 📚 API Reference

### `new KeyMintSDK(accessToken, baseUrl)`

| Parameter     | Type     | Description                                                                 |
| ------------- | -------- | --------------------------------------------------------------------------- |
| `accessToken` | `string` | **Required.** Your KeyMint API access token.                                |
| `baseUrl`     | `string` | *Optional.* The base URL for the KeyMint API. Defaults to `https://api.keymint.dev`. |

### `createKey(params)`

| Parameter        | Type     | Description                                                                 |
| ---------------- | -------- | --------------------------------------------------------------------------- |
| `productId`      | `string` | **Required.** The ID of the product.                                        |
| `maxActivations` | `string` | *Optional.* The maximum number of activations for the key.                  |
| `expiryDate`     | `string` | *Optional.* The expiration date of the key in ISO 8601 format.              |
| `customerId`     | `string` | *Optional.* The ID of an existing customer to associate with the key.       |
| `newCustomer`    | `object` | *Optional.* An object containing the name and email of a new customer.      |

### `activateKey(params)`

| Parameter    | Type     | Description                                                                 |
| ------------ | -------- | --------------------------------------------------------------------------- |
| `productId`  | `string` | **Required.** The ID of the product.                                        |
| `licenseKey` | `string` | **Required.** The license key to activate.                                  |
| `hostId`     | `string` | *Optional.* A unique identifier for the device.                             |
| `deviceTag`  | `string` | *Optional.* A user-friendly name for the device.                            |

### `deactivateKey(params)`

| Parameter    | Type     | Description                                                                 |
| ------------ | -------- | --------------------------------------------------------------------------- |
| `productId`  | `string` | **Required.** The ID of the product.                                        |
| `licenseKey` | `string` | **Required.** The license key to deactivate.                                |
| `hostId`     | `string` | *Optional.* The ID of the device to deactivate. If omitted, all devices are deactivated. |

### `getKey(params)`

| Parameter    | Type     | Description                                                                 |
| ------------ | -------- | --------------------------------------------------------------------------- |
| `productId`  | `string` | **Required.** The ID of the product.                                        |
| `licenseKey` | `string` | **Required.** The license key to retrieve.                                  |

### `blockKey(params)`

| Parameter    | Type     | Description                                                                 |
| ------------ | -------- | --------------------------------------------------------------------------- |
| `productId`  | `string` | **Required.** The ID of the product.                                        |
| `licenseKey` | `string` | **Required.** The license key to block.                                     |

### `unblockKey(params)`

| Parameter    | Type     | Description                                                                 |
| ------------ | -------- | --------------------------------------------------------------------------- |
| `productId`  | `string` | **Required.** The ID of the product.                                        |
| `licenseKey` | `string` | **Required.** The license key to unblock.                                   |

## 📜 License

This SDK is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

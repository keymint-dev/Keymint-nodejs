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
  const productId = process.env.KEYMINT_PRODUCT_ID;
  if (!accessToken || !productId) {
    console.error('Please set the KEYMINT_ACCESS_TOKEN and KEYMINT_PRODUCT_ID environment variables.');
    return;
  }

  const sdk = new KeyMintSDK(accessToken);

  try {
    // 1. Create a new license key
    const createResponse = await sdk.createKey({
      productId: productId,
      maxActivations: '5', // Optional: Maximum number of activations
    });
    const licenseKey = createResponse.key;
    console.log('Key created:', licenseKey);

    // 2. Activate the license key
    const activateResponse = await sdk.activateKey({
      productId: productId,
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

const accessToken = process.env.KEYMINT_ACCESS_TOKEN;
if (!accessToken) {
  throw new Error('Please set the KEYMINT_ACCESS_TOKEN environment variable.');
}
const sdk = new KeyMintSDK(accessToken);
```

### API Methods

All methods are asynchronous and return a `Promise`.

#### License Key Management

| Method          | Description                                     |
| --------------- | ----------------------------------------------- |
| `createKey`     | Creates a new license key.                      |
| `activateKey`   | Activates a license key for a device.           |
| `deactivateKey` | Deactivates a device from a license key.        |
| `getKey`        | Retrieves detailed information about a key.     |
| `blockKey`      | Blocks a license key.                           |
| `unblockKey`    | Unblocks a previously blocked license key.      |

#### Customer Management

| Method                | Description                                       |
| --------------------- | ------------------------------------------------- |
| `createCustomer`      | Creates a new customer.                           |
| `getAllCustomers`     | Retrieves all customers.                          |
| `getCustomerById`     | Gets a specific customer by ID.                   |
| `getCustomerWithKeys` | Gets a customer along with their license keys.   |
| `updateCustomer`      | Updates an existing customer's information.       |
| `toggleCustomerStatus`| Toggles a customer's active status.              |
| `deleteCustomer`      | Permanently deletes a customer and their keys.   |
| `deleteCustomer`      | Permanently deletes a customer and all associated license keys. |

For more detailed information about the API methods and their parameters, please refer to the [API Reference](#api-reference) section below.

## 🚨 Error Handling

If an API call fails, the SDK will throw an error object that matches the `KeyMintApiError` interface. Since this is not a runtime class, use property checks instead of `instanceof`.

```typescript
try {
  // ...
} catch (error) {
  // Type guard: check for the presence of expected properties
  if (error && typeof error === 'object' && 'code' in (error as Record<string, unknown>)) {
    const apiError = error as KeyMintApiError;
    console.error('API Error:', apiError.message);
    console.error('Status:', apiError.status);
    console.error('Code:', apiError.code);
  } else {
    console.error('An unexpected error occurred:', error);
  }
}
```

## 📋 Examples

### Customer Management

```typescript
// Create a new customer
const customer = await sdk.createCustomer({
  name: 'John Doe',
  email: 'john@example.com'
});

// Get all customers
const customers = await sdk.getAllCustomers();

// Get a specific customer by ID
const customerById = await sdk.getCustomerById({
  customerId: 'customer_123'
});

// Get customer with their license keys
const customerWithKeys = await sdk.getCustomerWithKeys({
  customerId: customer.data.id
});

// Update customer
const updatedCustomer = await sdk.updateCustomer({
  customerId: customer.data.id,
  name: 'John Smith',
  email: 'john.smith@example.com'
});

// Toggle customer status (enable/disable)
const toggleResponse = await sdk.toggleCustomerStatus({
  customerId: customer.data.id
});

// Delete customer permanently (irreversible!)
const deleteResponse = await sdk.deleteCustomer({
  customerId: customer.data.id
});
```

### Creating a License Key with a New Customer

```typescript
const licenseResponse = await sdk.createKey({
  productId: process.env.KEYMINT_PRODUCT_ID!,
  maxActivations: '3', // Optional
  newCustomer: {
    name: 'Jane Doe',
    email: 'jane@example.com'
  }
});
```

## 🔒 Security Best Practices

**Never hardcode your access tokens!** Always use environment variables:

1. **Create a `.env` file** (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. **Add your credentials** to `.env`:
   ```bash
   KEYMINT_ACCESS_TOKEN=your_actual_token_here
   KEYMINT_PRODUCT_ID=your_product_id_here
   ```

3. **Use environment variables** in your code:
   ```typescript
   const accessToken = process.env.KEYMINT_ACCESS_TOKEN;
   const sdk = new KeyMintSDK(accessToken);
   ```

⚠️ **Important**: Never commit `.env` files to version control. The `.gitignore` file already excludes them.

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

### Customer Management Methods

#### `createCustomer(params)`

| Parameter | Type     | Description                                      |
| --------- | -------- | ------------------------------------------------ |
| `name`    | `string` | **Required.** The customer's name.              |
| `email`   | `string` | **Required.** The customer's email address.     |

#### `getAllCustomers()`

No parameters required. Returns a list of all customers.

#### `getCustomerById(params)`

| Parameter    | Type     | Description                              |
| ------------ | -------- | ---------------------------------------- |
| `customerId` | `string` | **Required.** The ID of the customer.   |

#### `getCustomerWithKeys(params)`

| Parameter    | Type     | Description                              |
| ------------ | -------- | ---------------------------------------- |
| `customerId` | `string` | **Required.** The ID of the customer.   |

#### `updateCustomer(params)`

| Parameter    | Type      | Description                                           |
| ------------ | --------- | ----------------------------------------------------- |
| `customerId` | `string`  | **Required.** The ID of the customer to update.      |
| `name`       | `string`  | *Optional.* Updated customer name.                    |
| `email`      | `string`  | *Optional.* Updated customer email.                   |
| `active`     | `boolean` | *Optional.* Whether the customer is active.          |

#### `toggleCustomerStatus(params)`

| Parameter    | Type      | Description                                           |
| ------------ | --------- | ----------------------------------------------------- |
| `customerId` | `string`  | **Required.** The ID of the customer to toggle.      |

#### `deleteCustomer(params)`

| Parameter    | Type      | Description                                           |
| ------------ | --------- | ----------------------------------------------------- |
| `customerId` | `string`  | **Required.** The ID of the customer to delete permanently. |

⚠️ **Warning**: `deleteCustomer` permanently deletes the customer and all associated license keys. This action cannot be undone.

## 📜 License

This SDK is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

This SDK has been updated to match the latest KeyMint API changes:

**New Features:**
- ✅ Added customer management methods (`createCustomer`, `getAllCustomers`, `getCustomerWithKeys`, `updateCustomer`, `deleteCustomer`)
- ✅ Updated API endpoints to match new API structure
- ✅ Enhanced type safety with updated TypeScript interfaces
- ✅ `maxActivations` is now optional when creating license keys

**API Endpoint Changes:**
- `/create-key` → `/key`
- `/activate-key` → `/key/activate`
- `/deactivate-key` → `/key/deactivate`
- `/get-key` → `/key` (now uses GET method)
- `/block-key` → `/key/block`
- `/unblock-key` → `/key/unblock`

**Breaking Changes:**
- Response field names have been updated to camelCase (e.g., `licensee_name` → `licenseeName`)
- The `getKey` method now uses GET request with query parameters instead of POST

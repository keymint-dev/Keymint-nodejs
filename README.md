# KeyMint NodeJS SDK

A professional, production-ready SDK for integrating with the KeyMint API in Node.js/TypeScript. Provides robust, async-first access to all major KeyMint features, with strong typing and modern error handling.

## Features
- **Async/await**: All API calls are asynchronous.
- **TypeScript-first**: Strongly typed request and response models for all endpoints.
- **Consistent error handling**: All API errors are returned as structured objects.
- **Security**: Credentials are always loaded from environment variables.

## Installation
Add the SDK to your project:

```bash
npm install keymint
```

## Usage

```typescript
import KeyMint from 'keymint';

const accessToken = process.env.KEYMINT_ACCESS_TOKEN;
const productId = process.env.KEYMINT_PRODUCT_ID;

if (!accessToken || !productId) {
  throw new Error('Please set the KEYMINT_ACCESS_TOKEN and KEYMINT_PRODUCT_ID environment variables.');
}

const sdk = new KeyMint(accessToken);

// Example: Create a key
const result = await sdk.createKey({ productId });
if (result && result.key) {
  const key = result.key;
  // ...
} else {
  // Handle error
}
```

## Error Handling
All SDK methods return a `Promise` that resolves to a result object. Check for error properties before using the data. No API errors are thrown as uncaught exceptions.

## API Methods

All methods are asynchronous and return a `Promise`.

### License Key Management

| Method          | Description                                     |
|-----------------|-------------------------------------------------|
| `createKey`     | Creates a new license key.                      |
| `activateKey`   | Activates a license key for a device.           |
| `deactivateKey` | Deactivates a device from a license key.        |
| `getKey`        | Retrieves detailed information about a key.     |
| `blockKey`      | Blocks a license key.                           |
| `unblockKey`    | Unblocks a previously blocked license key.      |

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

For detailed parameter and response types, see the [KeyMint API docs](https://docs.keymint.dev) or use your IDE's IntelliSense.

## License
MIT

## Support
For help, see [KeyMint API docs](https://docs.keymint.dev) or open an issue.

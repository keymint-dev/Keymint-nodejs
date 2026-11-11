// Type-level checks, compiled by `npm run typecheck:tests` (nothing is emitted).
import type { CreateCustomerParams, UpdateKeyParams } from '../../src';

// UpdateKeyParams.expiryDate: a date sets it, null or "" removes it, omitting it keeps it.
export const setExpiry: UpdateKeyParams = { productId: 'p', licenseKey: 'k', expiryDate: '2030-01-01T00:00:00.000Z' };
export const clearExpiry: UpdateKeyParams = { productId: 'p', licenseKey: 'k', expiryDate: null };
export const clearExpiryEmpty: UpdateKeyParams = { productId: 'p', licenseKey: 'k', expiryDate: '' };
export const keepExpiry: UpdateKeyParams = { productId: 'p', licenseKey: 'k' };
// @ts-expect-error expiryDate is a string or null
export const numericExpiry: UpdateKeyParams = { productId: 'p', licenseKey: 'k', expiryDate: 0 };

// CreateCustomerParams.email is optional; name is required.
export const withoutEmail: CreateCustomerParams = { name: 'Ada Lovelace' };
export const withEmail: CreateCustomerParams = { name: 'Ada Lovelace', email: 'ada@example.com' };
// @ts-expect-error name is required
export const withoutName: CreateCustomerParams = { email: 'ada@example.com' };

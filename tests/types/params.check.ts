// Type-level checks, compiled by `npm run typecheck:tests` (nothing is emitted).
import type { CreateCustomerParams, CreateKeyParams, UpdateKeyParams } from '../../src';

// maxActivations: a whole number 0-1,000,000 (number or digit string) or "unlimited"; null means unlimited.
export const createLimitNumber: CreateKeyParams = { productId: 'p', maxActivations: 5 };
export const createLimitDigits: CreateKeyParams = { productId: 'p', maxActivations: '5' };
export const createUnlimited: CreateKeyParams = { productId: 'p', maxActivations: 'unlimited' };
export const createUnlimitedNull: CreateKeyParams = { productId: 'p', maxActivations: null };
export const createDefault: CreateKeyParams = { productId: 'p' };
// @ts-expect-error maxActivations is a number, string or null
export const createLimitBoolean: CreateKeyParams = { productId: 'p', maxActivations: true };
export const updateLimitNumber: UpdateKeyParams = { productId: 'p', licenseKey: 'k', maxActivations: 0 };
export const updateLimitDigits: UpdateKeyParams = { productId: 'p', licenseKey: 'k', maxActivations: '1000000' };
export const updateUnlimited: UpdateKeyParams = { productId: 'p', licenseKey: 'k', maxActivations: 'unlimited' };
export const updateUnlimitedNull: UpdateKeyParams = { productId: 'p', licenseKey: 'k', maxActivations: null };
// @ts-expect-error maxActivations is a number, string or null
export const updateLimitBoolean: UpdateKeyParams = { productId: 'p', licenseKey: 'k', maxActivations: true };

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

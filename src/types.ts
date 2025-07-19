// /Users/kliff/CascadeProjects/cascade/src/types.ts

/**
 * Represents the structure for creating a new customer
 * when creating a license key.
 */
export interface NewCustomer {
  name: string;
  email?: string; // Optional: Email of the new customer
}

/**
 * Parameters for the createKey API endpoint.
 */
export interface CreateKeyParams {
  productId: string;          // Required: The unique identifier of the product.
  maxActivations?: string;    // Optional: The maximum number of times the key can be activated.
  expiryDate?: string;        // Optional: The expiration date of the key in ISO 8601 format.
  customerId?: string;        // Optional: The ID of an existing customer to associate with the key.
  newCustomer?: NewCustomer;  // Optional: An object to create and associate a new customer with the key.
}

/**
 * Response structure for a successful createKey API call.
 */
export interface CreateKeyResponse {
  code: number; // API response code (e.g., 0 for success)
  key: string;  // The generated license key
}

/**
 * Standard error response structure from the KeyMint API.
 */
export interface KeyMintApiError {
  message: string; // Descriptive error message
  code: number;    // API specific error code
  status?: number;  // HTTP status code, optional
}

/**
 * Parameters for the activateKey API endpoint.
 */
export interface ActivateKeyParams {
  productId: string;  // Required: The unique identifier of the product.
  licenseKey: string; // Required: The license key to activate.
  hostId?: string;     // Optional: A unique identifier for the device.
  deviceTag?: string;  // Optional: A user-friendly name for the device.
}

/**
 * Response structure for a successful activateKey API call.
 */
export interface ActivateKeyResponse {
  code: number;           // API response code (e.g., 0 for success)
  message: string;        // Activation status message (e.g., "License valid")
  licensee_name?: string; // Optional: Name of the licensee
  licensee_email?: string;// Optional: Email of the licensee
}

/**
 * Parameters for the deactivateKey API endpoint.
 */
export interface DeactivateKeyParams {
  productId: string;  // Required: The unique identifier of the product.
  licenseKey: string; // Required: The license key to deactivate.
  hostId?: string;     // Optional: The unique identifier of the device to deactivate. If omitted, all devices are deactivated.
}

/**
 * Response structure for a successful deactivateKey API call.
 */
export interface DeactivateKeyResponse {
  message: string; // Confirmation message (e.g., "Device deactivated")
  code: number;    // API response code (e.g., 0 for success)
}

/**
 * Device details included in the GetKeyResponse.
 */
export interface DeviceDetails {
  host_id: string;
  device_tag?: string;
  ip_address?: string;
  activation_time: string;
}

/**
 * License details included in the GetKeyResponse.
 */
export interface LicenseDetails {
  id: string;
  key: string;
  product_id: string;
  max_activations: number;
  activations: number;
  devices: DeviceDetails[];
  activated: boolean;
  expiration_date?: string; // Optional, might not be present
}

/**
 * Customer details included in the GetKeyResponse.
 */
export interface CustomerDetails {
  id: string;
  name?: string; // Optional
  email?: string; // Optional
  active: boolean;
}

/**
 * Parameters for the getKey API endpoint.
 */
export interface GetKeyParams {
  productId: string;  // Required: The unique identifier of the product.
  licenseKey: string; // Required: The license key to retrieve.
}

/**
 * Response structure for a successful getKey API call.
 */
export interface GetKeyResponse {
  code: number; // API response code (e.g., 0 for success)
  data: {
    license: LicenseDetails;
    customer?: CustomerDetails; // Optional, customer data might not be present
  };
}

/**
 * Parameters for the blockKey API endpoint.
 */
export interface BlockKeyParams {
  productId: string;  // Required: The unique identifier of the product.
  licenseKey: string; // Required: The license key to block.
}

/**
 * Response structure for a successful blockKey API call.
 */
export interface BlockKeyResponse {
  message: string; // Confirmation message (e.g., "Key blocked")
  code: number;    // API response code (e.g., 0 for success)
}

/**
 * Parameters for the unblockKey API endpoint.
 */
export interface UnblockKeyParams {
  productId: string;  // Required: The unique identifier of the product.
  licenseKey: string; // Required: The license key to unblock.
}

/**
 * Response structure for a successful unblockKey API call.
 */
export interface UnblockKeyResponse {
  message: string; // Confirmation message (e.g., "Key unblocked")
  code: number;    // API response code (e.g., 0 for success)
}

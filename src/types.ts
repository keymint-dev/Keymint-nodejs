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
  productId: string;          // Required: Unique product identifier
  maxActivations?: string;    // Optional: Maximum number of activations
  expiryDate?: string;        // Optional: Expiration date in ISO 8601 format
  customerId?: string;        // Optional: ID of an existing customer
  newCustomer?: NewCustomer;  // Optional: Object to create a new customer
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
  productId: string;  // Required: Unique product identifier
  licenseKey: string; // Required: License key string
  hostId?: string;     // Optional: Unique device identifier
  deviceTag?: string;  // Optional: User-friendly device name
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
  productId: string;  // Required: Unique product identifier
  licenseKey: string; // Required: License key string
  hostId?: string;     // Optional: Unique device identifier. If omitted, all devices are deactivated.
}

/**
 * Response structure for a successful deactivateKey API call.
 */
export interface DeactivateKeyResponse {
  message: string; // Confirmation message (e.g., "Device deactivated")
  code: number;    // API response code (e.g., 0 for success)
}

// Added in Step 98
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
  productId: string;  // Required: Unique product identifier
  licenseKey: string; // Required: License key string
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
// End of Added in Step 98

// Added in Step 114
/**
 * Parameters for the blockKey API endpoint.
 */
export interface BlockKeyParams {
  productId: string;  // Required: Unique product identifier
  licenseKey: string; // Required: License key string to block
}

/**
 * Response structure for a successful blockKey API call.
 */
export interface BlockKeyResponse {
  message: string; // Confirmation message (e.g., "Key blocked")
  code: number;    // API response code (e.g., 0 for success)
}
// End of Added in Step 114

// Added in Step 124
/**
 * Parameters for the unblockKey API endpoint.
 */
export interface UnblockKeyParams {
  productId: string;  // Required: Unique product identifier
  licenseKey: string; // Required: License key string to unblock
}

/**
 * Response structure for a successful unblockKey API call.
 */
export interface UnblockKeyResponse {
  message: string; // Confirmation message (e.g., "Key unblocked")
  code: number;    // API response code (e.g., 0 for success)
}
// End of Added in Step 124

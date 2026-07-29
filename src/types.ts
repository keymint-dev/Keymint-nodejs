/**
 * Represents the structure for creating a new customer
 * when creating a license key.
 */
export interface NewCustomer {
  name: string;
  email?: string; // Optional: Email of the new customer
}

/**
 * Key format options for custom license key shapes.
 */
export interface KeyFormat {
  sections?: number;          // Optional: Number of sections (1-10)
  sectionLength?: number;     // Optional: Length of each section (1-32)
  separator?: string;         // Optional: Separator character (max 3 chars)
  charset?: string;           // Optional: Custom character set (no whitespace)
  prefix?: string;            // Optional: Prefix prepended to key (max 16 chars)
  suffix?: string;            // Optional: Suffix appended to key (max 16 chars)
  case?: 'upper' | 'lower' | 'mixed'; // Optional: Character case
}

/**
 * Parameters for the createKey API endpoint.
 */
export interface CreateKeyParams {
  productId: string;          // Required: The unique identifier of the product.
  maxActivations?: string;    // Optional: The maximum number of times the key can be activated.
  expiryDate?: string;        // Optional: The expiration date of the key in ISO 8601 format.
  customerId?: string;        // Optional: The ID of an existing customer to associate with the key.
  versionId?: string;         // Optional: The ID of a specific product version to associate with the key.
  metadata?: Record<string, any>; // Optional: Custom dictionary payload to attach to the license key.
  newCustomer?: NewCustomer;  // Optional: An object to create and associate a new customer with the key.
  allowedHosts?: string[];    // Optional: List of machine IDs authorized to use this license.
  format?: KeyFormat;         // Optional: Custom key format (sections, separator, charset, etc.)
  amountKeys?: string;        // Optional: Number of keys to generate at once (bulk creation)
  licenseType?: 'node-locked' | 'floating'; // Optional: License type (defaults to 'node-locked')
  maxConcurrentSessions?: number; // Optional: Max concurrent floating sessions
  heartbeatInterval?: number;     // Optional: Floating heartbeat interval in seconds (min 60)
  sessionLeaseDuration?: number;  // Optional: Floating session lease duration in seconds (min 300)
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
  licensee?: {         // Optional: Set customer name and email during activation
    name: string;
    email: string;
  };
  version?: string;    // Optional: Product version string (max 32 chars)
}

/**
 * Response structure for a successful activateKey API call.
 */
export interface ActivateKeyResponse {
  code: number;             // API response code (e.g., 0 for success)
  message: string;          // Activation status message (e.g., "License valid")
  licenseeName?: string;    // Optional: Name of the licensee (updated field name)
  licenseeEmail?: string;   // Optional: Email of the licensee (updated field name)
  metadata?: Record<string, any> | null; // Optional: Custom dictionary attached to the license key.
  versionId?: string | null;       // Optional: Associated product version ID.
  version?: {               // Optional: Detailed product version information.
    version: string;
  };
  allowedHosts?: string[] | null; // Optional: List of authorized machine IDs.
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
  hostId: string;           // Updated field name
  deviceTag?: string;       // Updated field name  
  ipAddress?: string;       // Updated field name
  activationTime: string;   // Updated field name
}

/**
 * License details included in the GetKeyResponse.
 */
export interface LicenseDetails {
  id: string;
  key: string;
  productId: string;        // Updated field name
  maxActivations: number;   // Updated field name
  activations: number;
  devices: DeviceDetails[];
  activated: boolean;
  expirationDate?: string | null;  // Updated field name
  versionId?: string | null;
  metadata?: Record<string, any> | null;
  allowedHosts?: string[] | null;
  version?: {
    id: string;
    version: string;
    description: string | null;
    active: boolean;
  } | null;
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

/**
 * Parameters for the createCustomer API endpoint.
 */
export interface CreateCustomerParams {
  name: string;     // Required: Customer name
  email: string;    // Required: Customer email
}

/**
 * Response structure for a successful createCustomer API call.
 */
export interface CreateCustomerResponse {
  action: string;   // Action performed (e.g., "createCustomer")
  status: boolean;  // Success status
  message: string;  // Success message
  data: {
    id: string;     // Customer ID
    name: string;   // Customer name
    email: string;  // Customer email
  };
  code: number;     // API response code (e.g., 0 for success)
}

/**
 * Customer information in the getAllCustomers response.
 */
export interface Customer {
  id: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

/**
 * Parameters for the getAllCustomers API endpoint.
 */
export interface GetAllCustomersParams {
  page?: number;   // Optional: Page number
  limit?: number;  // Optional: Items per page
  email?: string;  // Optional: Filter by email
}

/**
 * Pagination metadata included in list responses.
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Response structure for a successful getAllCustomers API call.
 */
export interface GetAllCustomersResponse {
  action: string;     // Action performed (e.g., "getCustomers")
  status: boolean;    // Success status
  data: Customer[];   // Array of customer objects
  meta?: PaginationMeta; // Optional: Pagination metadata
  code: number;       // API response code (e.g., 0 for success)
}

/**
 * Parameters for the getCustomerWithKeys API endpoint.
 */
export interface GetCustomerWithKeysParams {
  customerId: string; // Required: The customer ID
}

/**
 * License key information in customer with keys response.
 */
export interface CustomerLicenseKey {
  id: string;
  key: string;
  productId: string;
  maxActivations: number;
  activations: number;
  activated: boolean;
  expirationDate?: string;
  versionId?: string;
  metadata?: Record<string, any>;
  allowedHosts?: string[];
}

/**
 * Response structure for a successful getCustomerWithKeys API call.
 * Returns a flat array of license keys for the customer.
 */
export type GetCustomerWithKeysResponse = CustomerLicenseKey[];

/**
 * Parameters for the updateCustomer API endpoint.
 */
export interface UpdateCustomerParams {
  customerId: string;  // Required: The customer ID
  name?: string;       // Optional: Updated customer name
  email?: string;      // Optional: Updated customer email
}

/**
 * Response structure for a successful updateCustomer API call.
 */
export interface UpdateCustomerResponse {
  action: string;
  status: boolean;
  message: string;
  data: Customer;
  code: number;
}

/**
 * Parameters for the toggleCustomerStatus API endpoint.
 */
export interface ToggleCustomerStatusParams {
  customerId: string;  // Required: The customer ID
}

/**
 * Response structure for a successful toggleCustomerStatus API call.
 */
export interface ToggleCustomerStatusResponse {
  action: string;      // Action performed (e.g., "toggleActive")
  status: boolean;     // Success status
  message: string;     // Status message (e.g., "Customer disabled")
  code: number;        // API response code
}

/**
 * Parameters for the getCustomerById API endpoint.
 */
export interface GetCustomerByIdParams {
  customerId: string;  // Required: The customer ID
}

/**
 * Response structure for a successful getCustomerById API call.
 */
export interface GetCustomerByIdResponse {
  action: string;      // Action performed (e.g., "getCustomerById")
  status: boolean;     // Success status
  data: Customer[];    // Array containing the customer object
  code: number;        // API response code
}

/**
 * Parameters for the deleteCustomer API endpoint.
 */
export interface DeleteCustomerParams {
  customerId: string;  // Required: The customer ID
}

/**
 * Response structure for a successful deleteCustomer API call.
 */
export interface DeleteCustomerResponse {
  action: string;      // Action performed (e.g., "deleteCustomer")
  status: boolean;     // Success status
  message: string;     // Status message (e.g., "Customer deleted")
  code: number;        // API response code
}

/**
 * Parameters for the floating license checkout API endpoint.
 */
export interface FloatingCheckoutParams {
  productId: string;        // Required: The unique identifier of the product.
  licenseKey: string;       // Required: The license key.
  hostId: string;           // Required: The unique hardware identifier of the device.
  deviceTag?: string;       // Optional: Friendly name for the device.
  userIdentifier?: string;  // Optional: User identifier.
  apiKey?: string;          // Optional: API key override.
}

/**
 * Response structure for a successful floating license checkout API call.
 */
export interface FloatingCheckoutResponse {
  code: number;
  message: string;
  sessionId: string;
  sessionSecret: string;
  nextNonce: string;
  expiresAt: string;
  heartbeatInterval: number;
  metadata?: Record<string, any>;
  currentSessions?: number;
  maxSessions?: number | null;
  licenseeName?: string;
  licenseeEmail?: string;
}

/**
 * Parameters for the floating license heartbeat API endpoint.
 */
export interface FloatingHeartbeatParams {
  productId: string;        // Required: The unique identifier of the product.
  licenseKey: string;       // Required: The license key.
  sessionId: string;        // Required: The unique 22-character session ID.
  timestamp: string | number; // Required: The rotating nonce (nextNonce) received from the previous response.
  signature: string;        // Required: HMAC-SHA256 signature generated using the sessionSecret over the payload 'sessionId:nonce'.
  apiKey?: string;          // Optional: API key override.
}

/**
 * Response structure for a successful floating license heartbeat API call.
 */
export interface FloatingHeartbeatResponse {
  code: number;
  message: string;
  expiresAt: string;
  nextNonce: string;
}

/**
 * Parameters for the floating license checkin API endpoint.
 */
export interface FloatingCheckinParams {
  productId: string;        // Required: The unique identifier of the product.
  licenseKey: string;       // Required: The license key.
  sessionId: string;        // Required: The unique 22-character session ID.
  timestamp: string | number; // Required: The rotating nonce (nextNonce) received from the previous response.
  signature: string;        // Required: HMAC-SHA256 signature generated using the sessionSecret over the payload 'sessionId:nonce'.
  apiKey?: string;          // Optional: API key override.
}

/**
 * Response structure for a successful floating license checkin API call.
 */
export interface FloatingCheckinResponse {
  code: number;
  message: string;
}

/**
 * Parameters for the updateKey API endpoint (PATCH /api/key).
 */
export interface UpdateKeyParams {
  productId: string;          // Required: The unique identifier of the product.
  licenseKey: string;         // Required: The license key to update.
  maxActivations?: string | number;  // Optional: New max activations count
  expiryDate?: string;        // Optional: New expiration date in ISO 8601 format
  customerId?: string;        // Optional: New customer ID to associate
  newCustomer?: NewCustomer;  // Optional: Create and associate a new customer
  metadata?: Record<string, any>; // Optional: Updated custom metadata
  versionId?: string;         // Optional: Updated product version ID
  allowedHosts?: string[];    // Optional: Updated list of authorized machine IDs
  licenseType?: 'node-locked' | 'floating'; // Optional: Change license type
  maxConcurrentSessions?: number; // Optional: Updated max concurrent sessions
  heartbeatInterval?: number;     // Optional: Updated heartbeat interval (seconds, min 60)
  sessionLeaseDuration?: number;  // Optional: Updated session lease duration (seconds, min 300)
}

/**
 * Response structure for a successful updateKey API call.
 */
export interface UpdateKeyResponse {
  code: number;
  message: string;
  affectedCount?: number;
}

/**
 * Parameters for the signKey API endpoint (POST /api/key/sign).
 * Offline signing — returns a signed license file for air-gapped validation.
 * Requires admin scope and Standard plan.
 */
export interface SignKeyParams {
  productId: string;  // Required: The unique identifier of the product.
  licenseKey: string; // Required: The license key to sign.
  hostId: string;     // Required: The machine code to bind the offline license to.
  ttl?: number;       // Optional: Time-to-live in seconds (min 60).
}

/**
 * Response structure for a successful signKey API call.
 */
export interface SignKeyResponse {
  code: number;
  file: Record<string, any>; // Signed license file containing signedKey, keyId, publicKeyFingerprint
}

/**
 * Custom request options for Keymint API requests (e.g. idempotency keys).
 */
export interface RequestOptions {
  idempotencyKey?: string;
}

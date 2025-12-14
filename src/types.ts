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
  code: number;             // API response code (e.g., 0 for success)
  message: string;          // Activation status message (e.g., "License valid")
  licenseeName?: string;    // Optional: Name of the licensee (updated field name)
  licenseeEmail?: string;   // Optional: Email of the licensee (updated field name)
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
  expirationDate?: string;  // Updated field name
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
}

/**
 * Response structure for a successful getCustomerWithKeys API call.
 */
export interface GetCustomerWithKeysResponse {
  action: string;
  status: boolean;
  data: {
    customer: Customer;
    licenseKeys: CustomerLicenseKey[];
  };
  code: number;
}

/**
 * Parameters for the updateCustomer API endpoint.
 */
export interface UpdateCustomerParams {
  customerId: string;  // Required: The customer ID
  name?: string;       // Optional: Updated customer name
  email?: string;      // Optional: Updated customer email
  active?: boolean;    // Optional: Customer active status
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

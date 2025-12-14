// Main SDK entry point
import axios, { AxiosInstance, AxiosError } from 'axios';
import { 
  CreateKeyParams, CreateKeyResponse, KeyMintApiError, 
  ActivateKeyParams, ActivateKeyResponse, DeactivateKeyParams, 
  DeactivateKeyResponse, GetKeyParams, GetKeyResponse, 
  BlockKeyParams, BlockKeyResponse, UnblockKeyParams, 
  UnblockKeyResponse, CreateCustomerParams, CreateCustomerResponse,
  GetAllCustomersResponse, GetCustomerWithKeysParams, GetCustomerWithKeysResponse,
  UpdateCustomerParams, UpdateCustomerResponse, DeleteCustomerParams, DeleteCustomerResponse,
  ToggleCustomerStatusParams, ToggleCustomerStatusResponse, GetCustomerByIdParams, GetCustomerByIdResponse,
  GetAllCustomersParams
} from './types';

// Export all types from types.ts to make them available to SDK users
export * from './types';

export class KeyMint {
  private apiClient: AxiosInstance;

  constructor(accessToken: string, baseUrl = "https://api.keymint.dev") {
    if (!accessToken) {
      throw new Error("Access token is required to initialize the SDK.");
    }
    this.apiClient = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Generic method to handle POST requests.
   * @param endpoint - API endpoint
   * @param params - Request parameters
   * @returns A promise that resolves with the API response
   */
  private async handleRequest<T>(endpoint: string, params: object): Promise<T> {
    try {
      const response = await this.apiClient.post<T>(endpoint, params);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError<KeyMintApiError>);
    }
  }

  /**
   * Generic method to handle GET requests.
   * @param endpoint - API endpoint
   * @param params - Query parameters
   * @returns A promise that resolves with the API response
   */
  private async handleGetRequest<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    try {
      const response = await this.apiClient.get<T>(endpoint, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError<KeyMintApiError>);
    }
  }

  /**
   * Generic method to handle DELETE requests.
   * @param endpoint - API endpoint
   * @param params - Query parameters
   * @returns A promise that resolves with the API response
   */
  private async handleDeleteRequest<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    try {
      const response = await this.apiClient.delete<T>(endpoint, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError<KeyMintApiError>);
    }
  }

  /**
   * Generic method to handle PUT requests.
   * @param endpoint - API endpoint
   * @param params - Request parameters
   * @returns A promise that resolves with the API response
   */
  private async handlePutRequest<T>(endpoint: string, params: object): Promise<T> {
    try {
      const response = await this.apiClient.put<T>(endpoint, params);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError<KeyMintApiError>);
    }
  }

  /**
   * Creates a new license key.
   * @param params - Parameters for creating the key.
   * @returns A promise that resolves with the created key information or rejects with an error.
   */
  async createKey(params: CreateKeyParams): Promise<CreateKeyResponse> {
    return this.handleRequest<CreateKeyResponse>('/key', params);
  }

  /**
   * Activates a license key for a specific device.
   * @param params - Parameters for activating the key.
   * @returns A promise that resolves with the activation status or rejects with an error.
   */
  async activateKey(params: ActivateKeyParams): Promise<ActivateKeyResponse> {
    return this.handleRequest<ActivateKeyResponse>('/key/activate', params);
  }

  /**
   * Deactivates a device from a license key.
   * @param params - Parameters for deactivating the key.
   * @returns A promise that resolves with the deactivation confirmation or rejects with an error.
   */
  async deactivateKey(params: DeactivateKeyParams): Promise<DeactivateKeyResponse> {
    return this.handleRequest<DeactivateKeyResponse>('/key/deactivate', params);
  }

  /**
   * Retrieves detailed information about a specific license key.
   * @param params - Parameters for fetching the key details.
   * @returns A promise that resolves with the license key details or rejects with an error.
   */
  async getKey(params: GetKeyParams): Promise<GetKeyResponse> {
    return this.handleGetRequest<GetKeyResponse>('/key', {
      productId: params.productId,
      licenseKey: params.licenseKey
    });
  }

  /**
   * Blocks a specific license key.
   * @param params - Parameters for blocking the key.
   * @returns A promise that resolves with the block confirmation or rejects with an error.
   */
  async blockKey(params: BlockKeyParams): Promise<BlockKeyResponse> {
    return this.handleRequest<BlockKeyResponse>('/key/block', params);
  }

  /**
   * Unblocks a previously blocked license key.
   * @param params - Parameters for unblocking the key.
   * @returns A promise that resolves with the unblock confirmation or rejects with an error.
   */
  async unblockKey(params: UnblockKeyParams): Promise<UnblockKeyResponse> {
    return this.handleRequest<UnblockKeyResponse>('/key/unblock', params);
  }

  /**
   * Creates a new customer.
   * @param params - Parameters for creating the customer.
   * @returns A promise that resolves with the created customer information or rejects with an error.
   */
  async createCustomer(params: CreateCustomerParams): Promise<CreateCustomerResponse> {
    return this.handleRequest<CreateCustomerResponse>('/customer', params);
  }

  /**
   * Retrieves all customers.
   * @param params - Optional parameters for pagination and filtering.
   * @returns A promise that resolves with the list of all customers or rejects with an error.
   */
  async getAllCustomers(params?: GetAllCustomersParams): Promise<GetAllCustomersResponse> {
    return this.handleGetRequest<GetAllCustomersResponse>('/customer', params);
  }

  /**
   * Retrieves a customer along with their associated license keys.
   * @param params - Parameters for fetching the customer with keys.
   * @returns A promise that resolves with the customer and their license keys or rejects with an error.
   */
  async getCustomerWithKeys(params: GetCustomerWithKeysParams): Promise<GetCustomerWithKeysResponse> {
    return this.handleGetRequest<GetCustomerWithKeysResponse>('/customer/keys', {
      customerId: params.customerId
    });
  }

  /**
   * Updates an existing customer.
   * @param params - Parameters for updating the customer.
   * @returns A promise that resolves with the updated customer information or rejects with an error.
   */
  async updateCustomer(params: UpdateCustomerParams): Promise<UpdateCustomerResponse> {
    return this.handlePutRequest<UpdateCustomerResponse>('/customer/by-id', params);
  }

  /**
   * Deletes a customer and all associated license keys permanently.
   * @param params - Parameters for deleting the customer.
   * @returns A promise that resolves with the deletion confirmation or rejects with an error.
   */
  async deleteCustomer(params: DeleteCustomerParams): Promise<DeleteCustomerResponse> {
    return this.handleDeleteRequest<DeleteCustomerResponse>('/customer/by-id', {
      customerId: params.customerId
    });
  }

  /**
   * Toggles the status of a customer (active/inactive).
   * @param params - Parameters for toggling the customer status.
   * @returns A promise that resolves with the updated customer status or rejects with an error.
   */
  async toggleCustomerStatus(params: ToggleCustomerStatusParams): Promise<ToggleCustomerStatusResponse> {
    return this.handleRequest<ToggleCustomerStatusResponse>('/customer/disable', {
      customerId: params.customerId
    });
  }

  /**
   * Retrieves detailed information about a specific customer by ID.
   * @param params - Parameters for fetching the customer details.
   * @returns A promise that resolves with the customer details or rejects with an error.
   */
  async getCustomerById(params: GetCustomerByIdParams): Promise<GetCustomerByIdResponse> {
    return this.handleGetRequest<GetCustomerByIdResponse>(`/customer/by-id`, {
      customerId: params.customerId
    });
  }

  private handleError(axiosError: AxiosError<KeyMintApiError>): KeyMintApiError {
    const defaultApiErrorMessage = 'An API error occurred during the request.';
    const defaultUnexpectedErrorMessage = 'An unexpected error occurred.';

    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    if (axiosError.isAxiosError && axiosError.response) {
      const responseData = axiosError.response.data;
      
      // The API returned a structured error message
      if (typeof responseData === 'object' && responseData !== null && 'message' in responseData) { 
        return {
          message: responseData.message || defaultApiErrorMessage,
          code: typeof responseData.code === 'number' ? responseData.code : -1,
          status: axiosError.response.status
        };
      } else {
        // The API responded, but the error format was unexpected
        return {
          message: defaultApiErrorMessage, 
          code: -1, 
          status: axiosError.response.status
        };
      }
    } else {
      // Something happened in setting up the request that triggered an Error
      // or there was no response from the server
      return {
        message: axiosError.message || defaultUnexpectedErrorMessage,
        code: -1,
        status: undefined
      };
    }
  }
}

export default KeyMint;

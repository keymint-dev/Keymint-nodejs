// Main SDK entry point
import axios, { AxiosInstance, AxiosError } from 'axios';
import { 
  CreateKeyParams, CreateKeyResponse, KeyMintApiError, 
  ActivateKeyParams, ActivateKeyResponse, DeactivateKeyParams, 
  DeactivateKeyResponse, GetKeyParams, GetKeyResponse, 
  BlockKeyParams, BlockKeyResponse, UnblockKeyParams, 
  UnblockKeyResponse, CreateCustomerParams, CreateCustomerResponse,
  GetAllCustomersResponse, GetCustomerWithKeysParams, GetCustomerWithKeysResponse,
  UpdateCustomerParams, UpdateCustomerResponse
} from './types';

// Export all types from types.ts to make them available to SDK users
export * from './types';

export class KeyMintSDK {
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
  private async handleGetRequest<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    try {
      const response = await this.apiClient.get<T>(endpoint, { params });
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
   * @returns A promise that resolves with the list of all customers or rejects with an error.
   */
  async getAllCustomers(): Promise<GetAllCustomersResponse> {
    return this.handleGetRequest<GetAllCustomersResponse>('/customer');
  }

  /**
   * Retrieves a customer along with their associated license keys.
   * @param params - Parameters for fetching the customer with keys.
   * @returns A promise that resolves with the customer and their license keys or rejects with an error.
   */
  async getCustomerWithKeys(params: GetCustomerWithKeysParams): Promise<GetCustomerWithKeysResponse> {
    return this.handleGetRequest<GetCustomerWithKeysResponse>(`/customer/${params.customerId}/keys`);
  }

  /**
   * Updates an existing customer.
   * @param params - Parameters for updating the customer.
   * @returns A promise that resolves with the updated customer information or rejects with an error.
   */
  async updateCustomer(params: UpdateCustomerParams): Promise<UpdateCustomerResponse> {
    const { customerId, ...updateData } = params;
    return this.handleRequest<UpdateCustomerResponse>(`/customer/${customerId}`, updateData);
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

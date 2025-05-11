// Main SDK entry point
import axios, { AxiosInstance, AxiosError } from 'axios';
import { CreateKeyParams, CreateKeyResponse, KeyMintApiError, ActivateKeyParams, ActivateKeyResponse, DeactivateKeyParams, DeactivateKeyResponse, GetKeyParams, GetKeyResponse, BlockKeyParams, BlockKeyResponse, UnblockKeyParams, UnblockKeyResponse } from './types';

export class KeyMintSDK {
  private apiClient: AxiosInstance;

  constructor(accessToken: string, baseUrl: string = "https://api.keymint.dev") {
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
   * Creates a new license key.
   * @param params - Parameters for creating the key.
   * @returns A promise that resolves with the created key information or rejects with an error.
   */
  async createKey(params: CreateKeyParams): Promise<CreateKeyResponse> {
    try {
      const response = await this.apiClient.post<CreateKeyResponse>('/create-key', params);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError<KeyMintApiError>);
    }
  }

  /**
   * Activates a license key for a specific device.
   * @param params - Parameters for activating the key.
   * @returns A promise that resolves with the activation status or rejects with an error.
   */
  async activateKey(params: ActivateKeyParams): Promise<ActivateKeyResponse> {
    try {
      const response = await this.apiClient.post<ActivateKeyResponse>('/activate-key', params);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError<KeyMintApiError>);
    }
  }

  /**
   * Deactivates a device from a license key.
   * @param params - Parameters for deactivating the key.
   * @returns A promise that resolves with the deactivation confirmation or rejects with an error.
   */
  async deactivateKey(params: DeactivateKeyParams): Promise<DeactivateKeyResponse> {
    try {
      const response = await this.apiClient.post<DeactivateKeyResponse>('/deactivate-key', params);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError<KeyMintApiError>);
    }
  }

  /**
   * Retrieves detailed information about a specific license key.
   * @param params - Parameters for fetching the key details.
   * @returns A promise that resolves with the license key details or rejects with an error.
   */
  async getKey(params: GetKeyParams): Promise<GetKeyResponse> {
    try {
      const response = await this.apiClient.post<GetKeyResponse>('/get-key', params);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError<KeyMintApiError>);
    }
  }

  /**
   * Blocks a specific license key.
   * @param params - Parameters for blocking the key.
   * @returns A promise that resolves with the block confirmation or rejects with an error.
   */
  async blockKey(params: BlockKeyParams): Promise<BlockKeyResponse> {
    try {
      const response = await this.apiClient.post<BlockKeyResponse>('/block-key', params);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError<KeyMintApiError>);
    }
  }

  /**
   * Unblocks a previously blocked license key.
   * @param params - Parameters for unblocking the key.
   * @returns A promise that resolves with the unblock confirmation or rejects with an error.
   */
  async unblockKey(params: UnblockKeyParams): Promise<UnblockKeyResponse> {
    try {
      const response = await this.apiClient.post<UnblockKeyResponse>('/unblock-key', params);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError<KeyMintApiError>);
    }
  }

  private handleError(axiosError: AxiosError<KeyMintApiError>): KeyMintApiError {
    const defaultApiErrorMessage = 'An API error occurred during the request.';
    const defaultUnexpectedErrorMessage = 'An unexpected error occurred.';

    // Check if it's an Axios error with a response object
    if (axiosError.isAxiosError && axiosError.response) {
      const responseData = axiosError.response.data;
      // Check if responseData is an object and has the expected properties
      if (typeof responseData === 'object' && responseData !== null && 'message' in responseData) { 
        return {
          message: responseData.message || defaultApiErrorMessage,
          code: typeof responseData.code === 'number' ? responseData.code : -1,
          status: axiosError.response.status
        };
      } else {
        // API responded, but data is not in the expected { message, code } format or is missing
        return {
          message: defaultApiErrorMessage, 
          code: -1, 
          status: axiosError.response.status // HTTP status is still useful
        };
      }
    } else {
      // Non-Axios error or Axios error without a response (e.g., network error, request setup error)
      return {
        message: axiosError.message || defaultUnexpectedErrorMessage,
        code: -1,
        status: undefined // No HTTP status for non-response errors
      };
    }
  }
}

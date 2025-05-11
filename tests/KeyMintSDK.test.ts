import { KeyMintSDK } from '../src/index'; // Adjust path if your src is structured differently
import mockAxios, { mockPost } from './__mocks__/axios'; // Our mock post function and axios mock from the __mocks__ directory
import { 
  KeyMintApiError,
  CreateKeyParams, CreateKeyResponse,
  ActivateKeyParams, ActivateKeyResponse,
  DeactivateKeyParams, DeactivateKeyResponse,
  GetKeyParams, GetKeyResponse,
  BlockKeyParams, BlockKeyResponse,
  UnblockKeyParams, UnblockKeyResponse
} from '../src/types';

describe('KeyMintSDK', () => {
  const accessToken = 'test_access_token_123';
  let sdk: KeyMintSDK;

  beforeEach(() => {
    // Create a new SDK instance before each test
    sdk = new KeyMintSDK(accessToken);
    // Reset the mock post function before each test to clear previous calls
    mockPost.mockReset(); 
    // Reset common headers on the mock Axios instance to ensure test isolation
    const mockSdkInstance = (sdk as any).apiClient;
    if (mockSdkInstance && mockSdkInstance.defaults && mockSdkInstance.defaults.headers) {
      mockSdkInstance.defaults.headers.common = {};
    }
    // Re-apply the create logic to set the default headers for the current SDK instance
    // This is a bit of a workaround because the instance is created before this reset.
    // A cleaner way might involve resetting the mock create function too, but this is simpler for now.
    if (mockAxios.create.mock.calls.length > 0) {
        const lastCallConfig = mockAxios.create.mock.calls[mockAxios.create.mock.calls.length -1][0];
        if(lastCallConfig && lastCallConfig.headers){
             Object.assign(mockSdkInstance.defaults.headers.common, lastCallConfig.headers);
        }
    }
  });

  describe('createKey', () => {
    it('should call /create-key with correct params and headers, and return key data on success', async () => {
      const params: CreateKeyParams = { productId: 'prod_123' };
      const expectedResponse: CreateKeyResponse = { code: 0, key: 'lk_test_key_12345' };
      
      // Configure the mock to resolve with our expected response
      mockPost.mockResolvedValueOnce({ data: expectedResponse });

      const result = await sdk.createKey(params);

      // Check if axios.post was called correctly
      expect(mockPost).toHaveBeenCalledWith('/create-key', params);
      // Check if the apiClient instance (which mockAxios.create() returns) has the correct headers.
      // This is a bit indirect but necessary because headers are set on instance creation.
      const mockAxiosInstance = (sdk as any).apiClient; // Access private member for test
      expect(mockAxiosInstance.defaults.headers.common['Authorization']).toBe(`Bearer ${accessToken}`);
      expect(mockAxiosInstance.defaults.headers.common['Content-Type']).toBe('application/json');

      // Check if the result matches our expected response
      expect(result).toEqual(expectedResponse);
    });

    it('should throw a KeyMintApiError when API returns an error', async () => {
      const params: CreateKeyParams = { productId: 'prod_invalid' };
      const apiErrorResponse: KeyMintApiError = { message: 'Product not found', code: 4041 };
      
      // Configure the mock to reject with an Axios-like error structure
      mockPost.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          data: apiErrorResponse,
          status: 404,
        },
      });

      try {
        await sdk.createKey(params);
        // If createKey doesn't throw, the test should fail
        fail('Expected createKey to throw KeyMintApiError'); 
      } catch (error: any) {
        expect(error.message).toBe(apiErrorResponse.message);
        expect(error.code).toBe(apiErrorResponse.code);
        expect(error.status).toBe(404);
      }
    });

    it('should throw a generic error for non-API errors', async () => {
      const params: CreateKeyParams = { productId: 'prod_network_failure' };
      const networkError = new Error('Network connection failed');
      
      mockPost.mockRejectedValueOnce(networkError); // Simulate a network error (not an Axios error with a response)

      try {
        await sdk.createKey(params);
        fail('Expected createKey to throw a generic error');
      } catch (error: any) {
        expect(error.message).toBe('Network connection failed');
        expect(error.code).toBe(-1); // Default code for generic errors
        expect(error.status).toBeNull(); // Status is null for non-HTTP errors
      }
    });
  });

  describe('activateKey', () => {
    const defaultParams: ActivateKeyParams = { 
      productId: 'prod_xyz', 
      licenseKey: 'lk_valid_key' 
    };

    it('should call /activate-key with correct params and return success response', async () => {
      const params: ActivateKeyParams = { ...defaultParams, hostId: 'device_123' };
      const expectedResponse: ActivateKeyResponse = { 
        code: 0, 
        message: 'License valid', 
        licensee_name: 'Test User', 
        licensee_email: 'test@example.com' 
      };
      
      mockPost.mockResolvedValueOnce({ data: expectedResponse });

      const result = await sdk.activateKey(params);

      expect(mockPost).toHaveBeenCalledWith('/activate-key', params);
      expect(result).toEqual(expectedResponse);
    });

    it('should throw KeyMintApiError when API returns an activation error', async () => {
      const params: ActivateKeyParams = { ...defaultParams, licenseKey: 'lk_invalid_key' };
      const apiErrorResponse: KeyMintApiError = { message: 'Invalid license key', code: 2 };
      
      mockPost.mockRejectedValueOnce({
        isAxiosError: true,
        response: { data: apiErrorResponse, status: 400 },
      });

      try {
        await sdk.activateKey(params);
        fail('Expected activateKey to throw KeyMintApiError');
      } catch (error: any) {
        expect(error.message).toBe(apiErrorResponse.message);
        expect(error.code).toBe(apiErrorResponse.code);
        expect(error.status).toBe(400);
      }
    });

    it('should throw a generic error for non-API errors during activation', async () => {
      const params: ActivateKeyParams = { ...defaultParams };
      const networkError = new Error('Connection timed out');
      
      mockPost.mockRejectedValueOnce(networkError);

      try {
        await sdk.activateKey(params);
        fail('Expected activateKey to throw a generic error');
      } catch (error: any) {
        expect(error.message).toBe('Connection timed out');
        expect(error.code).toBe(-1);
        expect(error.status).toBeNull();
      }
    });
  });

  describe('deactivateKey', () => {
    const defaultParams: DeactivateKeyParams = { 
      productId: 'prod_abc', 
      licenseKey: 'lk_active_key',
      hostId: 'device_to_deactivate_456'
    };

    it('should call /deactivate-key with correct params and return success response', async () => {
      const expectedResponse: DeactivateKeyResponse = { 
        code: 0, 
        message: 'Host deactivated successfully' 
      };
      
      mockPost.mockResolvedValueOnce({ data: expectedResponse });

      const result = await sdk.deactivateKey(defaultParams);

      expect(mockPost).toHaveBeenCalledWith('/deactivate-key', defaultParams);
      expect(result).toEqual(expectedResponse);
    });

    it('should throw KeyMintApiError when API returns a deactivation error', async () => {
      const apiErrorResponse: KeyMintApiError = { message: 'Host ID not found for this license', code: 6 };
      
      mockPost.mockRejectedValueOnce({
        isAxiosError: true,
        response: { data: apiErrorResponse, status: 400 },
      });

      try {
        await sdk.deactivateKey(defaultParams);
        fail('Expected deactivateKey to throw KeyMintApiError');
      } catch (error: any) {
        expect(error.message).toBe(apiErrorResponse.message);
        expect(error.code).toBe(apiErrorResponse.code);
        expect(error.status).toBe(400);
      }
    });

    it('should throw a generic error for non-API errors during deactivation', async () => {
      const networkError = new Error('Server unreachable');
      
      mockPost.mockRejectedValueOnce(networkError);

      try {
        await sdk.deactivateKey(defaultParams);
        fail('Expected deactivateKey to throw a generic error');
      } catch (error: any) {
        expect(error.message).toBe('Server unreachable');
        expect(error.code).toBe(-1);
        expect(error.status).toBeNull();
      }
    });
  });

  describe('getKey', () => {
    const defaultParams: GetKeyParams = { 
      productId: 'prod_789', 
      licenseKey: 'lk_detail_test_key'
    };

    it('should call /get-key with correct params and return key details', async () => {
      const expectedResponse: GetKeyResponse = { 
        code: 0,
        data: {
          license: {
            id: 'license_uuid_123',
            key: 'lk_detail_test_key',
            product_id: 'prod_789',
            max_activations: 5,
            activations: 1, // Current number of active devices
            devices: [
              { host_id: 'device_A', activation_time: '2023-01-02T00:00:00Z', ip_address: '192.168.1.10', device_tag: 'Main Computer' },
              { host_id: 'device_B', activation_time: '2023-01-03T00:00:00Z', ip_address: '192.168.1.11', device_tag: 'Laptop' }
            ],
            activated: true, // Is the license currently considered active overall
            expiration_date: undefined, // Or a date string like '2024-12-31T23:59:59Z' or null
          },
          customer: {
            id: 'customer_uuid_456',
            name: 'Detailed Test User',
            email: 'detail@example.com',
            active: true
          }
        }
      };
      
      mockPost.mockResolvedValueOnce({ data: expectedResponse });

      const result = await sdk.getKey(defaultParams);

      expect(mockPost).toHaveBeenCalledWith('/get-key', defaultParams);
      expect(result).toEqual(expectedResponse);
    });

    it('should throw KeyMintApiError when API returns an error (e.g., key not found)', async () => {
      const apiErrorResponse: KeyMintApiError = { message: 'License key not found', code: 3 };
      
      mockPost.mockRejectedValueOnce({
        isAxiosError: true,
        response: { data: apiErrorResponse, status: 404 },
      });

      try {
        await sdk.getKey(defaultParams);
        fail('Expected getKey to throw KeyMintApiError');
      } catch (error: any) {
        expect(error.message).toBe(apiErrorResponse.message);
        expect(error.code).toBe(apiErrorResponse.code);
        expect(error.status).toBe(404);
      }
    });

    it('should throw a generic error for non-API errors during key retrieval', async () => {
      const networkError = new Error('DNS resolution failed');
      
      mockPost.mockRejectedValueOnce(networkError);

      try {
        await sdk.getKey(defaultParams);
        fail('Expected getKey to throw a generic error');
      } catch (error: any) {
        expect(error.message).toBe('DNS resolution failed');
        expect(error.code).toBe(-1);
        expect(error.status).toBeNull();
      }
    });
  });

  describe('blockKey', () => {
    const defaultParams: BlockKeyParams = { 
      productId: 'prod_block_test', 
      licenseKey: 'lk_to_be_blocked'
    };

    it('should call /block-key with correct params and return success message', async () => {
      const expectedResponse: BlockKeyResponse = { 
        code: 0, 
        message: 'Key blocked successfully' 
      };
      
      mockPost.mockResolvedValueOnce({ data: expectedResponse });

      const result = await sdk.blockKey(defaultParams);

      expect(mockPost).toHaveBeenCalledWith('/block-key', defaultParams);
      expect(result).toEqual(expectedResponse);
    });

    it('should throw KeyMintApiError when API returns an error (e.g., key already blocked)', async () => {
      const apiErrorResponse: KeyMintApiError = { message: 'Key is already blocked', code: 7 }; // Assuming '7' is the code for already blocked
      
      mockPost.mockRejectedValueOnce({
        isAxiosError: true,
        response: { data: apiErrorResponse, status: 409 }, // 409 Conflict might be appropriate
      });

      try {
        await sdk.blockKey(defaultParams);
        fail('Expected blockKey to throw KeyMintApiError');
      } catch (error: any) {
        expect(error.message).toBe(apiErrorResponse.message);
        expect(error.code).toBe(apiErrorResponse.code);
        expect(error.status).toBe(409);
      }
    });

    it('should throw a generic error for non-API errors during blocking', async () => {
      const networkError = new Error('Request failed due to network issue');
      
      mockPost.mockRejectedValueOnce(networkError);

      try {
        await sdk.blockKey(defaultParams);
        fail('Expected blockKey to throw a generic error');
      } catch (error: any) {
        expect(error.message).toBe('Request failed due to network issue');
        expect(error.code).toBe(-1);
        expect(error.status).toBeNull();
      }
    });
  });

  describe('unblockKey', () => {
    const defaultParams: UnblockKeyParams = { 
      productId: 'prod_unblock_test', 
      licenseKey: 'lk_to_be_unblocked'
    };

    it('should call /unblock-key with correct params and return success message', async () => {
      const expectedResponse: UnblockKeyResponse = { 
        code: 0, 
        message: 'Key unblocked successfully' 
      };
      
      mockPost.mockResolvedValueOnce({ data: expectedResponse });

      const result = await sdk.unblockKey(defaultParams);

      expect(mockPost).toHaveBeenCalledWith('/unblock-key', defaultParams);
      expect(result).toEqual(expectedResponse);
    });

    it('should throw KeyMintApiError when API returns an error (e.g., key not blocked or not found)', async () => {
      const apiErrorResponse: KeyMintApiError = { message: 'Key is not currently blocked', code: 8 }; // Assuming '8' for not blocked
      
      mockPost.mockRejectedValueOnce({
        isAxiosError: true,
        response: { data: apiErrorResponse, status: 400 }, // 400 Bad Request might be appropriate
      });

      try {
        await sdk.unblockKey(defaultParams);
        fail('Expected unblockKey to throw KeyMintApiError');
      } catch (error: any) {
        expect(error.message).toBe(apiErrorResponse.message);
        expect(error.code).toBe(apiErrorResponse.code);
        expect(error.status).toBe(400);
      }
    });

    it('should throw a generic error for non-API errors during unblocking', async () => {
      const networkError = new Error('API endpoint unreachable');
      
      mockPost.mockRejectedValueOnce(networkError);

      try {
        await sdk.unblockKey(defaultParams);
        fail('Expected unblockKey to throw a generic error');
      } catch (error: any) {
        expect(error.message).toBe('API endpoint unreachable');
        expect(error.code).toBe(-1);
        expect(error.status).toBeNull();
      }
    });
  });

  // End of tests
  // etc.
  // etc.
  // etc.
  // etc.
  // describe('activateKey', () => { ... });
  // etc.

});

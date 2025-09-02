import { KeyMintSDK } from '../src/index'; // Adjust path if your src is structured differently
import mockAxios, { mockPost, mockGet } from './__mocks__/axios'; // Our mock post function and axios mock from the __mocks__ directory
import { 
  KeyMintApiError,
  CreateKeyParams, CreateKeyResponse,
  ActivateKeyParams, ActivateKeyResponse,
  DeactivateKeyParams, DeactivateKeyResponse,
  GetKeyParams, GetKeyResponse,
  BlockKeyParams, BlockKeyResponse,
  UnblockKeyParams, UnblockKeyResponse,
  CreateCustomerParams, CreateCustomerResponse,
  GetAllCustomersResponse
} from '../src/types';

describe('KeyMintSDK', () => {
  const accessToken = 'test_access_token_123';
  let sdk: KeyMintSDK;

  beforeEach(() => {
    // Reset all mocks before each test
    mockAxios.create.mockClear();
    mockPost.mockClear();
    mockGet.mockClear();

    // Create a new SDK instance for each test to ensure isolation
    sdk = new KeyMintSDK(accessToken);
  });

  describe('createKey', () => {
    it('should call /key with correct params and headers, and return key data on success', async () => {
      const params: CreateKeyParams = { productId: 'prod_123', maxActivations: '5' };
      const expectedResponse: CreateKeyResponse = { code: 0, key: 'lk_test_key_12345' };
      
      // Configure the mock to resolve with our expected response
      mockPost.mockResolvedValueOnce({ data: expectedResponse });

      const result = await sdk.createKey(params);

      // Check if axios.post was called correctly
      expect(mockPost).toHaveBeenCalledWith('/key', params);
      // Check if the apiClient instance (which mockAxios.create() returns) has the correct headers.
      // This is a bit indirect but necessary because headers are set on instance creation.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockAxiosInstance = (sdk as any).apiClient; // Access private member for test
      expect(mockAxiosInstance.defaults.headers.common['Authorization']).toBe(`Bearer ${accessToken}`);
      expect(mockAxiosInstance.defaults.headers.common['Content-Type']).toBe('application/json');

      // Check if the result matches our expected response
      expect(result).toEqual(expectedResponse);
    });

    it('should work without maxActivations parameter', async () => {
      const params: CreateKeyParams = { productId: 'prod_123' };
      const expectedResponse: CreateKeyResponse = { code: 0, key: 'lk_test_key_12345' };
      
      mockPost.mockResolvedValueOnce({ data: expectedResponse });

      const result = await sdk.createKey(params);

      expect(mockPost).toHaveBeenCalledWith('/key', params);
      expect(result).toEqual(expectedResponse);
    });

    it('should throw a KeyMintApiError when API returns an error', async () => {
      const params: CreateKeyParams = { productId: 'prod_invalid', maxActivations: '5' };
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
      } catch (error) {
        const thrownError = error as KeyMintApiError;
        expect(thrownError.message).toBe(apiErrorResponse.message);
        expect(thrownError.code).toBe(apiErrorResponse.code);
        expect(thrownError.status).toBe(404);
      }
    });

    it('should throw a generic error for non-API errors', async () => {
      const params: CreateKeyParams = { productId: 'prod_network_failure', maxActivations: '5' };
      const networkError = new Error('Network connection failed');
      
      mockPost.mockRejectedValueOnce(networkError); // Simulate a network error (not an Axios error with a response)

      try {
        await sdk.createKey(params);
        fail('Expected createKey to throw a generic error');
      } catch (error) {
        const thrownError = error as KeyMintApiError;
        expect(thrownError.message).toBe('Network connection failed');
        expect(thrownError.code).toBe(-1); // Default code for generic errors
        expect(thrownError.status).toBeUndefined(); // Status is undefined for non-HTTP errors
      }
    });
  });

  describe('activateKey', () => {
    const defaultParams: ActivateKeyParams = { 
      productId: 'prod_xyz', 
      licenseKey: 'lk_valid_key' 
    };

    it('should call /key/activate with correct params and return success response', async () => {
      const params: ActivateKeyParams = { ...defaultParams, hostId: 'device_123' };
      const expectedResponse: ActivateKeyResponse = { 
        code: 0, 
        message: 'License valid', 
        licenseeName: 'Test User', 
        licenseeEmail: 'test@example.com' 
      };
      
      mockPost.mockResolvedValueOnce({ data: expectedResponse });

      const result = await sdk.activateKey(params);

      expect(mockPost).toHaveBeenCalledWith('/key/activate', params);
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
      } catch (error) {
        const thrownError = error as KeyMintApiError;
        expect(thrownError.message).toBe(apiErrorResponse.message);
        expect(thrownError.code).toBe(apiErrorResponse.code);
        expect(thrownError.status).toBe(400);
      }
    });

    it('should throw a generic error for non-API errors during activation', async () => {
      const params: ActivateKeyParams = { ...defaultParams };
      const networkError = new Error('Connection timed out');
      
      mockPost.mockRejectedValueOnce(networkError);

      try {
        await sdk.activateKey(params);
        fail('Expected activateKey to throw a generic error');
      } catch (error) {
        const thrownError = error as KeyMintApiError;
        expect(thrownError.message).toBe('Connection timed out');
        expect(thrownError.code).toBe(-1);
        expect(thrownError.status).toBeUndefined();
      }
    });
  });

  describe('deactivateKey', () => {
    const defaultParams: DeactivateKeyParams = { 
      productId: 'prod_abc', 
      licenseKey: 'lk_active_key',
      hostId: 'device_to_deactivate_456'
    };

    it('should call /key/deactivate with correct params and return success response', async () => {
      const expectedResponse: DeactivateKeyResponse = { 
        code: 0, 
        message: 'Host deactivated successfully' 
      };
      
      mockPost.mockResolvedValueOnce({ data: expectedResponse });

      const result = await sdk.deactivateKey(defaultParams);

      expect(mockPost).toHaveBeenCalledWith('/key/deactivate', defaultParams);
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
      } catch (error) {
        const thrownError = error as KeyMintApiError;
        expect(thrownError.message).toBe(apiErrorResponse.message);
        expect(thrownError.code).toBe(apiErrorResponse.code);
        expect(thrownError.status).toBe(400);
      }
    });

    it('should throw a generic error for non-API errors during deactivation', async () => {
      const networkError = new Error('Server unreachable');
      
      mockPost.mockRejectedValueOnce(networkError);

      try {
        await sdk.deactivateKey(defaultParams);
        fail('Expected deactivateKey to throw a generic error');
      } catch (error) {
        const thrownError = error as KeyMintApiError;
        expect(thrownError.message).toBe('Server unreachable');
        expect(thrownError.code).toBe(-1);
        expect(thrownError.status).toBeUndefined();
      }
    });
  });

  describe('getKey', () => {
    const defaultParams: GetKeyParams = { 
      productId: 'prod_789', 
      licenseKey: 'lk_detail_test_key'
    };

    it('should call /key with GET method and correct params and return key details', async () => {
      const expectedResponse: GetKeyResponse = { 
        code: 0,
        data: {
          license: {
            id: 'license_uuid_123',
            key: 'lk_detail_test_key',
            productId: 'prod_789',
            maxActivations: 5,
            activations: 1, // Current number of active devices
            devices: [
              { hostId: 'device_A', activationTime: '2023-01-02T00:00:00Z', ipAddress: '192.168.1.10', deviceTag: 'Main Computer' },
              { hostId: 'device_B', activationTime: '2023-01-03T00:00:00Z', ipAddress: '192.168.1.11', deviceTag: 'Laptop' }
            ],
            activated: true, // Is the license currently considered active overall
            expirationDate: undefined, // Or a date string like '2024-12-31T23:59:59Z' or null
          },
          customer: {
            id: 'customer_uuid_456',
            name: 'Detailed Test User',
            email: 'detail@example.com',
            active: true
          }
        }
      };
      
      mockGet.mockResolvedValueOnce({ data: expectedResponse });

      const result = await sdk.getKey(defaultParams);

      expect(mockGet).toHaveBeenCalledWith('/key', {
        params: {
          productId: defaultParams.productId,
          licenseKey: defaultParams.licenseKey
        }
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should throw KeyMintApiError when API returns an error (e.g., key not found)', async () => {
      const apiErrorResponse: KeyMintApiError = { message: 'License key not found', code: 3 };
      
      mockGet.mockRejectedValueOnce({
        isAxiosError: true,
        response: { data: apiErrorResponse, status: 404 },
      });

      try {
        await sdk.getKey(defaultParams);
        fail('Expected getKey to throw KeyMintApiError');
      } catch (error) {
        const thrownError = error as KeyMintApiError;
        expect(thrownError.message).toBe(apiErrorResponse.message);
        expect(thrownError.code).toBe(apiErrorResponse.code);
        expect(thrownError.status).toBe(404);
      }
    });

    it('should throw a generic error for non-API errors during key retrieval', async () => {
      const networkError = new Error('DNS resolution failed');
      
      mockGet.mockRejectedValueOnce(networkError);

      try {
        await sdk.getKey(defaultParams);
        fail('Expected getKey to throw a generic error');
      } catch (error) {
        const thrownError = error as KeyMintApiError;
        expect(thrownError.message).toBe('DNS resolution failed');
        expect(thrownError.code).toBe(-1);
        expect(thrownError.status).toBeUndefined();
      }
    });
  });

  describe('blockKey', () => {
    const defaultParams: BlockKeyParams = { 
      productId: 'prod_block_test', 
      licenseKey: 'lk_to_be_blocked'
    };

    it('should call /key/block with correct params and return success message', async () => {
      const expectedResponse: BlockKeyResponse = { 
        code: 0, 
        message: 'Key blocked successfully' 
      };
      
      mockPost.mockResolvedValueOnce({ data: expectedResponse });

      const result = await sdk.blockKey(defaultParams);

      expect(mockPost).toHaveBeenCalledWith('/key/block', defaultParams);
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
      } catch (error) {
        const thrownError = error as KeyMintApiError;
        expect(thrownError.message).toBe(apiErrorResponse.message);
        expect(thrownError.code).toBe(apiErrorResponse.code);
        expect(thrownError.status).toBe(409);
      }
    });

    it('should throw a generic error for non-API errors during blocking', async () => {
      const networkError = new Error('Request failed due to network issue');
      
      mockPost.mockRejectedValueOnce(networkError);

      try {
        await sdk.blockKey(defaultParams);
        fail('Expected blockKey to throw a generic error');
      } catch (error) {
        const thrownError = error as KeyMintApiError;
        expect(thrownError.message).toBe('Request failed due to network issue');
        expect(thrownError.code).toBe(-1);
        expect(thrownError.status).toBeUndefined();
      }
    });
  });

  describe('unblockKey', () => {
    const defaultParams: UnblockKeyParams = { 
      productId: 'prod_unblock_test', 
      licenseKey: 'lk_to_be_unblocked'
    };

    it('should call /key/unblock with correct params and return success message', async () => {
      const expectedResponse: UnblockKeyResponse = { 
        code: 0, 
        message: 'Key unblocked successfully' 
      };
      
      mockPost.mockResolvedValueOnce({ data: expectedResponse });

      const result = await sdk.unblockKey(defaultParams);

      expect(mockPost).toHaveBeenCalledWith('/key/unblock', defaultParams);
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
      } catch (error) {
        const thrownError = error as KeyMintApiError;
        expect(thrownError.message).toBe(apiErrorResponse.message);
        expect(thrownError.code).toBe(apiErrorResponse.code);
        expect(thrownError.status).toBe(400);
      }
    });

    it('should throw a generic error for non-API errors during unblocking', async () => {
      const networkError = new Error('API endpoint unreachable');
      
      mockPost.mockRejectedValueOnce(networkError);

      try {
        await sdk.unblockKey(defaultParams);
        fail('Expected unblockKey to throw a generic error');
      } catch (error) {
        const thrownError = error as KeyMintApiError;
        expect(thrownError.message).toBe('API endpoint unreachable');
        expect(thrownError.code).toBe(-1);
        expect(thrownError.status).toBeUndefined();
      }
    });
  });

  // Customer Management Tests
  describe('createCustomer', () => {
    const defaultParams: CreateCustomerParams = { 
      name: 'Test Customer', 
      email: 'test@example.com'
    };

    it('should call /customer with correct params and return customer data', async () => {
      const expectedResponse: CreateCustomerResponse = { 
        action: 'createCustomer',
        status: true,
        message: 'Customer created successfully',
        data: {
          id: 'customer_123',
          name: 'Test Customer',
          email: 'test@example.com'
        },
        code: 0
      };
      
      mockPost.mockResolvedValueOnce({ data: expectedResponse });

      const result = await sdk.createCustomer(defaultParams);

      expect(mockPost).toHaveBeenCalledWith('/customer', defaultParams);
      expect(result).toEqual(expectedResponse);
    });

    it('should throw KeyMintApiError when customer with email already exists', async () => {
      const apiErrorResponse: KeyMintApiError = { message: 'Customer with this email already exists', code: 409 };
      
      mockPost.mockRejectedValueOnce({
        isAxiosError: true,
        response: { data: apiErrorResponse, status: 409 },
      });

      try {
        await sdk.createCustomer(defaultParams);
        fail('Expected createCustomer to throw KeyMintApiError');
      } catch (error) {
        const thrownError = error as KeyMintApiError;
        expect(thrownError.message).toBe(apiErrorResponse.message);
        expect(thrownError.code).toBe(apiErrorResponse.code);
        expect(thrownError.status).toBe(409);
      }
    });
  });

  describe('getAllCustomers', () => {
    it('should call /customer with GET method and return customers list', async () => {
      const expectedResponse: GetAllCustomersResponse = { 
        action: 'getCustomers',
        status: true,
        data: [
          {
            id: 'customer_1',
            name: 'Customer One',
            email: 'customer1@example.com',
            active: true,
            createdAt: '2025-09-01T14:46:10.932Z',
            updatedAt: '2025-09-01T14:46:10.622Z',
            createdBy: 'user_123'
          },
          {
            id: 'customer_2',
            name: 'Customer Two',
            email: 'customer2@example.com',
            active: true,
            createdAt: '2025-09-01T15:46:10.932Z',
            updatedAt: '2025-09-01T15:46:10.622Z',
            createdBy: 'user_123'
          }
        ],
        code: 0
      };
      
      mockGet.mockResolvedValueOnce({ data: expectedResponse });

      const result = await sdk.getAllCustomers();

      expect(mockGet).toHaveBeenCalledWith('/customer', { params: undefined });
      expect(result).toEqual(expectedResponse);
    });

    it('should throw KeyMintApiError when API returns an error', async () => {
      const apiErrorResponse: KeyMintApiError = { message: 'Unauthorized access', code: 401 };
      
      mockGet.mockRejectedValueOnce({
        isAxiosError: true,
        response: { data: apiErrorResponse, status: 401 },
      });

      try {
        await sdk.getAllCustomers();
        fail('Expected getAllCustomers to throw KeyMintApiError');
      } catch (error) {
        const thrownError = error as KeyMintApiError;
        expect(thrownError.message).toBe(apiErrorResponse.message);
        expect(thrownError.code).toBe(apiErrorResponse.code);
        expect(thrownError.status).toBe(401);
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

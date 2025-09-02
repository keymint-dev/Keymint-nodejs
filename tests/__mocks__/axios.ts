const mockAxiosInstance = {
  post: jest.fn(),
  get: jest.fn(), // Added for completeness, though not used yet
  // Add other HTTP methods if your SDK expands to use them
  defaults: { // Simulate Axios instance defaults
    headers: {
      common: {} // Store common headers, like those set by axios.create()
    }
  }
};

const mockAxios = {
  create: jest.fn((config) => {
    // When axios.create is called, merge provided headers into our mock instance's defaults
    if (config && config.headers) {
      Object.assign(mockAxiosInstance.defaults.headers.common, config.headers);
    }
    // Optionally merge baseURL if you need to test it
    // if (config && config.baseURL) { mockAxiosInstance.defaults.baseURL = config.baseURL; }
    return mockAxiosInstance;
  }),
  // Expose the actual AxiosError if needed for type checking in tests,
  // otherwise, Jest's default error/object comparison should suffice.
  // AxiosError: jest.requireActual('axios').AxiosError 
};

export default mockAxios;

// Exporting the mock implementations of post and get for convenience in tests
export const mockPost = mockAxiosInstance.post;
export const mockGet = mockAxiosInstance.get;

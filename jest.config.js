module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  moduleNameMapper: {
    // This will map 'axios' imports to our mock implementation
    '^axios$': '<rootDir>/tests/__mocks__/axios.ts' 
  },
  // Automatically clear mock calls and instances before every test
  clearMocks: true, 
};

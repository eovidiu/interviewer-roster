/**
 * Jest Configuration for Security Tests
 */

export default {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 30000,
  verbose: true,
  collectCoverage: false,
  coverageDirectory: 'reports/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['js', 'json'],
  transform: {},
  // Run tests in a single worker to avoid circular JSON serialization errors
  // with axios response objects containing sockets and agents
  maxWorkers: 1
}

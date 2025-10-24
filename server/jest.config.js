export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testMatch: ['**/src/**/*.test.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/src/features/users/repository\\.test\\.js$', // Exclude Node.js test runner file
  ],
  collectCoverageFrom: ['src/**/*.js', '!src/**/*.test.js'],
  passWithNoTests: true, // Don't fail if no tests found
}

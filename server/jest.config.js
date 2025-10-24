export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testMatch: ['**/src/**/*.{test,node.test}.js'],
  testPathIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom: ['src/**/*.js', '!src/**/*.test.js', '!src/**/*.node.test.js'],
  passWithNoTests: true, // Don't fail if no tests found
}

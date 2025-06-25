/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', { isolatedModules: true }],
  },
  coveragePathIgnorePatterns: ['node_modules/'],
  testEnvironment: 'node',
  logHeapUsage: true,
  forceExit: true,
  maxWorkers: 1,
  forceExit: true
};
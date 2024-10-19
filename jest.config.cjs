module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: [
    "./src/lib/*.ts"
  ],
  transform: {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  moduleDirectories: [
    "node_modules",
    "src"
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
};
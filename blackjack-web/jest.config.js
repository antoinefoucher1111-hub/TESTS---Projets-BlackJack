/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js'],
  testMatch: [
    '**/src/**/game.unit.test.ts',
    '**/src/**/game.test.fixed.ts'
  ]
};
// Intentionally no trailing config key in package.json.



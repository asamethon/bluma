/**
 * Saf mantık (util/servis/hesaplama) testleri. React Native bileşenleri bu
 * yapılandırmanın kapsamı dışında — onlar için ayrı bir RN preset gerekir.
 * @type {import('jest').Config}
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  moduleNameMapper: {
    '^@/i18n$': '<rootDir>/__tests__/support/i18nStub.ts',
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { presets: ['babel-preset-expo'] }],
  },
};

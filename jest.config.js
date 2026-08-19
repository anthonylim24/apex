/** Jest runs headlessly in Node — no device, emulator, or Watch required.
 * The jest-expo preset handles React Native + Expo module transforms. */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@supabase/.*|@clerk/.*|zustand|@tanstack/.*)',
  ],
  setupFiles: ['<rootDir>/src/test/jest.setup.js'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/__tests__/**', '!src/test/**'],
};

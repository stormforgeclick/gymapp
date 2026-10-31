// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // The generated database types are not ours to edit.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/types/database.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
]);

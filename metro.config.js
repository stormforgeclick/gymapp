// https://docs.expo.dev/guides/customizing-metro/
// Sentry's version of the default config: it gives each JavaScript bundle a Debug ID
// so errors reported from a build can be read against the original source code.
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname);

module.exports = config;

// Settings for the fingerprint that ties over-the-air updates to a native build
// (see .fingerprintignore and docs/lanzamiento.md).
/** @type {import('@expo/fingerprint').Config} */
const config = {
  // npm scripts (test, lint, db:types...) do not change the native app, so editing
  // them must not stop an update from reaching the builds that are already out.
  sourceSkips: ['PackageJsonScriptsAll'],
};

module.exports = config;

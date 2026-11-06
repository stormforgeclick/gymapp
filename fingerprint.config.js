// Settings for the fingerprint that ties over-the-air updates to a native build
// (see .fingerprintignore and docs/lanzamiento.md).
/** @type {import('@expo/fingerprint').Config} */
const config = {
  sourceSkips: [
    // npm scripts (test, lint, db:types...) do not change the native app, so editing
    // them must not stop an update from reaching the builds that are already out.
    'PackageJsonScriptsAll',
    // Neither does .gitignore: adding a line to it (say `.env.local`) is not a native
    // change, but by default it is hashed and would orphan every installed build.
    'GitIgnore',
  ],
};

module.exports = config;

import { readFileSync } from "node:fs";
import { join } from "node:path";

const config = readFileSync(join(__dirname, "..", "..", ".github", "dependabot.yml"), "utf8");

const ignoresAlways = (name: string) =>
  new RegExp(`dependency-name:\\s*"${name.replace(/[*/]/g, "\\$&")}"\\s*(\\n\\s*-|\\n\\s*groups:|\\n\\s*[a-z-]+:|$)`).test(config);

const ignoresMajorsOf = (name: string) =>
  new RegExp(
    `dependency-name:\\s*"${name}"\\s*\\n\\s*update-types:\\s*\\["version-update:semver-major"\\]`
  ).test(config);

/**
 * Dependabot opens a PR per update. Some can't be accepted on their own: Expo
 * fixes the version of its packages for each SDK, and a few tools only work
 * with the major version the Expo tooling was built against. Their PRs would be
 * red or, worse, green by accident, so they are not opened at all.
 */
describe("Dependabot configuration", () => {
  it.each(["expo", "expo-*", "jest-expo", "react-native", "react-native-*"])(
    "leaves %s to `npx expo install`",
    (name) => {
      expect(ignoresAlways(name)).toBe(true);
    }
  );

  // jest-expo 57 is built on Jest 29: it depends on babel-jest, jest-snapshot and
  // jest-environment-jsdom ^29. Jest moves with jest-expo, when the SDK does.
  it.each(["jest", "@types/jest"])("does not open PRs for a new major of %s", (name) => {
    expect(ignoresMajorsOf(name)).toBe(true);
  });

  // eslint-config-expo's plugins (react, import) declare support up to ESLint 9.
  it("does not open PRs for a new major of eslint", () => {
    expect(ignoresMajorsOf("eslint")).toBe(true);
  });

  it("keeps explaining why in the file itself", () => {
    expect(config).toMatch(/jest-expo[^\n]*Jest 29/i);
    expect(config).toMatch(/eslint-config-expo[^\n]*ESLint 9/i);
  });
});

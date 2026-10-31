import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..", "..");

const read = (file: string) => JSON.parse(readFileSync(join(ROOT, file), "utf8"));
const expo = read("app.json").expo;
const eas = read("eas.json");
const packageJson = read("package.json");

/**
 * Over-the-air updates let a JavaScript fix reach testers without a new APK. An
 * update only fits builds that have the same native code, and each build looks
 * for updates on the channel of its profile.
 */
describe("over-the-air updates", () => {
  it("has the library that applies them", () => {
    expect(Object.keys(packageJson.dependencies)).toContain("expo-updates");
  });

  it("looks for updates in this EAS project", () => {
    expect(expo.updates.url).toBe(`https://u.expo.dev/${expo.extra.eas.projectId}`);
  });

  it("only applies an update to builds with the same native code", () => {
    expect(expo.runtimeVersion).toEqual({ policy: "fingerprint" });
  });

  it.each(["preview", "production"])("sends %s builds to a channel of the same name", (profile) => {
    expect(eas.build[profile].channel).toBe(profile);
  });

  // The fingerprint decides which builds an update fits. EAS builds from a clean
  // checkout, so anything only a developer's machine has must not be part of it,
  // or an update published from that machine would never match the builds.
  it("leaves the generated native folders out of the fingerprint", () => {
    const ignored = readFileSync(join(ROOT, ".fingerprintignore"), "utf8");

    expect(ignored).toContain("android/**/*");
    expect(ignored).toContain("ios/**/*");
  });

  it("does not let a change to the npm scripts count as a native change", () => {
    const config = readFileSync(join(ROOT, "fingerprint.config.js"), "utf8");

    expect(config).toContain("PackageJsonScriptsAll");
  });

  it.each(["development", "development-simulator"])(
    "keeps the %s build out of the channels: it loads its code from the dev server",
    (profile) => {
      expect(eas.build[profile].channel).toBeUndefined();
    }
  );
});

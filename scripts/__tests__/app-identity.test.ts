import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, posix } from "node:path";

const ROOT = join(__dirname, "..", "..");

const expo = JSON.parse(readFileSync(join(ROOT, "app.json"), "utf8")).expo;

const filesUnder = (dir: string): string[] =>
  readdirSync(join(ROOT, dir)).flatMap((name) => {
    const path = posix.join(dir, name);
    return statSync(join(ROOT, path)).isDirectory() ? filesUnder(path) : [path];
  });

/**
 * The Android package is the app's identity: it cannot change once APKs are
 * handed out (people would have to reinstall) or once the app is on Google Play.
 */
describe("app identity", () => {
  it("uses the package the project settled on", () => {
    expect(expo.android.package).toBe("com.stormforgeclick.gymbro");
  });

  it("is not the placeholder Expo generates when no package is chosen", () => {
    expect(expo.android.package).not.toMatch(/^com\.anonymous\./);
  });

  it("belongs to the Expo organization that owns the EAS project", () => {
    expect(expo.owner).toBe("stormforge");
  });

  it("is the app the Maestro flows open", () => {
    const flows = filesUnder(".maestro").filter((path) => path.endsWith(".yaml"));
    const appIds = flows.map((path) => {
      const match = /^appId:\s*(\S+)\s*$/m.exec(readFileSync(join(ROOT, path), "utf8"));
      return `${path}: ${match?.[1] ?? "(no appId)"}`;
    });

    expect(flows.length).toBeGreaterThan(0);
    expect(appIds).toEqual(flows.map((path) => `${path}: ${expo.android.package}`));
  });
});

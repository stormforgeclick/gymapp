import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..", "..");

type Plugin = string | [string, Record<string, unknown>];
type ExpoConfig = {
  name: string;
  slug: string;
  scheme: string;
  android: { package: string; [key: string]: unknown };
  plugins: Plugin[];
  [key: string]: unknown;
};

const base: ExpoConfig = JSON.parse(readFileSync(join(ROOT, "app.json"), "utf8")).expo;
const createConfig = jest.requireActual<(context: { config: ExpoConfig }) => ExpoConfig>(
  "../../app.config.js"
);

/** Evaluates the dynamic config the way Expo does, with these environment variables set. */
const resolve = (
  env: { APP_VARIANT?: string; EAS_BUILD?: string } = {},
  given: ExpoConfig = structuredClone(base)
) => {
  const saved = { APP_VARIANT: process.env.APP_VARIANT, EAS_BUILD: process.env.EAS_BUILD };
  for (const [key, value] of Object.entries({ APP_VARIANT: undefined, EAS_BUILD: undefined, ...env })) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    return createConfig({ config: given });
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
};

const VARIANTS = ["development", "preview", "production"] as const;

const pluginName = (plugin: Plugin) => (Array.isArray(plugin) ? plugin[0] : plugin);
const pluginOptions = (config: ExpoConfig, name: string) => {
  const found = config.plugins.find((plugin) => pluginName(plugin) === name);
  return Array.isArray(found) ? found[1] : undefined;
};

/**
 * Development, preview and production are different apps to Android only if
 * their package differs: with one package, installing one asks to replace the
 * other. The package of production is the project's identity and does not move.
 */
describe("app variants", () => {
  it("keeps the identity the project settled on for production", () => {
    const production = resolve({ APP_VARIANT: "production" });

    expect(production.android.package).toBe("com.stormforgeclick.gymbro");
    expect(production.name).toBe(base.name);
    expect(production.scheme).toBe(base.scheme);
  });

  it("is production on a developer's machine when nothing says otherwise", () => {
    expect(resolve()).toEqual(resolve({ APP_VARIANT: "production" }));
  });

  it("gives each variant its own package, name and scheme", () => {
    const configs = VARIANTS.map((variant) => resolve({ APP_VARIANT: variant }));

    expect(new Set(configs.map((config) => config.android.package)).size).toBe(3);
    expect(new Set(configs.map((config) => config.name)).size).toBe(3);
    expect(new Set(configs.map((config) => config.scheme)).size).toBe(3);
  });

  it("hangs the development and preview packages from the production one", () => {
    expect(resolve({ APP_VARIANT: "development" }).android.package).toBe(
      "com.stormforgeclick.gymbro.dev"
    );
    expect(resolve({ APP_VARIANT: "preview" }).android.package).toBe(
      "com.stormforgeclick.gymbro.preview"
    );
  });

  it("names the apps so they can be told apart on the phone", () => {
    expect(resolve({ APP_VARIANT: "development" }).name).toMatch(/Dev/);
    expect(resolve({ APP_VARIANT: "preview" }).name).toMatch(/Preview/);
  });

  // An update is looked up by project and channel: a different slug or project
  // would make a variant a different app to Expo as well.
  it.each(VARIANTS)("keeps the rest of the settings in %s", (variant) => {
    const config = resolve({ APP_VARIANT: variant });

    for (const key of ["slug", "owner", "version", "runtimeVersion", "updates", "extra", "icon"]) {
      expect(config[key]).toEqual(base[key]);
    }
    expect(config.android.adaptiveIcon).toEqual(base.android.adaptiveIcon);
    expect(config.plugins.map(pluginName)).toEqual(expect.arrayContaining(base.plugins.map(pluginName)));
    expect(pluginOptions(config, "@sentry/react-native/expo")).toEqual(
      pluginOptions(base, "@sentry/react-native/expo")
    );
  });

  // expo-dev-client adds an `exp+<slug>` scheme to every build unless told not to;
  // with two apps on the phone, the one that should not have it would answer
  // the links and QR codes meant for the development app.
  it.each([
    ["development", true],
    ["preview", false],
    ["production", false],
  ] as const)("sets the dev client scheme of %s to %s", (variant, expected) => {
    const config = resolve({ APP_VARIANT: variant });

    expect(pluginOptions(config, "expo-dev-client")).toEqual({ addGeneratedScheme: expected });
  });

  it("does not change the settings it was given", () => {
    const given = structuredClone(base);

    resolve({ APP_VARIANT: "preview" }, given);

    expect(given).toEqual(base);
  });

  // A build in the cloud that falls back to production would install over the
  // real app and calculate a different update fingerprint than the updates do.
  it("refuses to build in EAS without saying which app it is", () => {
    expect(() => resolve({ EAS_BUILD: "true" })).toThrow(/APP_VARIANT/);
  });

  it("builds in EAS when it is told which app it is", () => {
    expect(resolve({ EAS_BUILD: "true", APP_VARIANT: "preview" }).android.package).toBe(
      "com.stormforgeclick.gymbro.preview"
    );
  });

  it("refuses a variant it does not know, and says which ones exist", () => {
    expect(() => resolve({ APP_VARIANT: "staging" })).toThrow(/staging.*development, preview, production/);
  });

  it("does not take the name of an inherited property as a variant", () => {
    expect(() => resolve({ APP_VARIANT: "constructor" })).toThrow(/constructor/);
  });
});

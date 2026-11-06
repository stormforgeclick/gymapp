import { readFileSync } from "node:fs";
import { join } from "node:path";

const expo = JSON.parse(readFileSync(join(__dirname, "..", "..", "app.json"), "utf8")).expo;

type Plugin = string | [string, { organization?: string; project?: string }];

const sentryPlugin = (expo.plugins as Plugin[]).find(
  (plugin) => (Array.isArray(plugin) ? plugin[0] : plugin).startsWith("@sentry/react-native")
);

/**
 * Sentry's Expo plugin uploads source maps while a release build is made. Without
 * the organization and project to upload to (and a token in the build's
 * environment) that step has nothing to aim at, so the plugin only goes in
 * together with them. Crash reporting itself works without the plugin.
 */
describe("Sentry config plugin", () => {
  it("uploads the source maps to the project of this app in the stormforge-p0 organization", () => {
    // The organization lives in the US region (its DSN ends in ingest.us.sentry.io).
    expect(sentryPlugin).toEqual([
      "@sentry/react-native/expo",
      { url: "https://sentry.io/", organization: "stormforge-p0", project: "gymbroapp" },
    ]);
  });

  it("is only enabled together with the organization and project to upload to", () => {
    if (!sentryPlugin) return;

    const options = Array.isArray(sentryPlugin) ? sentryPlugin[1] : {};
    expect(options.organization).toBeTruthy();
    expect(options.project).toBeTruthy();
  });
});

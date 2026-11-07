// Dynamic Expo config on top of app.json: the same app in three variants that can be
// installed side by side. Android tells apps apart by their package, so with one
// package, installing the development app asks to replace the preview one.
// See docs/lanzamiento.md and docs/decisiones.md.
//
// The variant comes from APP_VARIANT. It lives in the EAS environment variables
// (development, preview and production), because `eas update --environment` reads
// only those: build and update must resolve the same variant to calculate the same
// fingerprint, or an update never reaches the build.

// What each variant adds to the identity in app.json, which is production's.
const VARIANTS = {
  development: { packageSuffix: ".dev", nameSuffix: " (Dev)", schemeSuffix: "-dev" },
  preview: { packageSuffix: ".preview", nameSuffix: " (Preview)", schemeSuffix: "-preview" },
  production: { packageSuffix: "", nameSuffix: "", schemeSuffix: "" },
};

const resolveVariant = (env) => {
  const names = Object.keys(VARIANTS).join(", ");
  const requested = env.APP_VARIANT;

  if (!requested) {
    // A build in the cloud that fell back to production would install over the real
    // app and calculate another update fingerprint, so it is better to stop it.
    if (env.EAS_BUILD) {
      throw new Error(
        `APP_VARIANT is not set in this EAS build. Define it as an EAS environment variable (${names}) in the environment of the build profile.`
      );
    }
    // On a developer's machine, no variant is the app as it is in app.json.
    return "production";
  }

  if (!Object.hasOwn(VARIANTS, requested)) {
    throw new Error(`Unknown APP_VARIANT "${requested}". Use one of: ${names}.`);
  }
  return requested;
};

module.exports = ({ config }) => {
  const variant = resolveVariant(process.env);
  const { packageSuffix, nameSuffix, schemeSuffix } = VARIANTS[variant];

  return {
    ...config,
    name: config.name + nameSuffix,
    scheme: config.scheme + schemeSuffix,
    android: { ...config.android, package: config.android.package + packageSuffix },
    plugins: [
      ...(config.plugins ?? []),
      // expo-dev-client adds an `exp+<slug>` scheme to every build unless told not to:
      // only the development app should answer the links and QR codes of `expo start`.
      ["expo-dev-client", { addGeneratedScheme: variant === "development" }],
    ],
  };
};

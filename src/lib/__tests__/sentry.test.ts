import * as Sentry from "@sentry/react-native";

import { reportError, setErrorReporter } from "../report";
import { initSentry } from "../sentry";

// Sentry is an outside service: it is the one thing replaced in these tests.
jest.mock("@sentry/react-native", () => ({
  init: jest.fn(),
  captureException: jest.fn(),
}));

const DSN = "https://publickey@o1.ingest.sentry.io/2";

describe("initSentry", () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => setErrorReporter(null));

  it("does nothing without a DSN, so a build without an account still works", () => {
    expect(initSentry({ dsn: undefined, dev: false })).toBe(false);
    expect(initSentry({ dsn: "", dev: false })).toBe(false);

    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it("stays out of development, where errors go to the console", () => {
    expect(initSentry({ dsn: DSN, dev: true })).toBe(false);

    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it("starts the SDK with the DSN and without personal data or performance traces", () => {
    expect(initSentry({ dsn: DSN, dev: false })).toBe(true);

    expect(Sentry.init).toHaveBeenCalledTimes(1);
    expect(Sentry.init).toHaveBeenCalledWith({
      dsn: DSN,
      sendDefaultPii: false,
      tracesSampleRate: 0,
    });
  });

  it("sends the errors the app reports to Sentry, tagged with where they happened", () => {
    initSentry({ dsn: DSN, dev: false });
    const error = new Error("boom");

    reportError(error, { source: "query", key: ["routines", "es"] });

    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      tags: { source: "query" },
      extra: { key: ["routines", "es"] },
    });
  });

  describe("with the DSN in the environment", () => {
    const original = process.env.EXPO_PUBLIC_SENTRY_DSN;

    beforeEach(() => {
      process.env.EXPO_PUBLIC_SENTRY_DSN = DSN;
    });
    afterEach(() => {
      if (original === undefined) delete process.env.EXPO_PUBLIC_SENTRY_DSN;
      else process.env.EXPO_PUBLIC_SENTRY_DSN = original;
    });

    it("reads it from EXPO_PUBLIC_SENTRY_DSN", () => {
      expect(initSentry({ dev: false })).toBe(true);

      expect(Sentry.init).toHaveBeenCalledWith(expect.objectContaining({ dsn: DSN }));
    });

    it("still stays out of development, which is what a build made with the dev server is", () => {
      // Jest runs with __DEV__ on, as the dev server does.
      expect(initSentry()).toBe(false);

      expect(Sentry.init).not.toHaveBeenCalled();
    });
  });

  it("does not take over the reporter when it did not start", () => {
    initSentry({ dsn: undefined, dev: false });

    reportError(new Error("boom"), { source: "query" });

    expect(Sentry.captureException).not.toHaveBeenCalled();
  });
});

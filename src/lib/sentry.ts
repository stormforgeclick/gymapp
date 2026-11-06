import * as Sentry from "@sentry/react-native";

import { setErrorReporter } from "./report";

type Options = {
  /** Public: it only lets the app send events to the project. */
  dsn?: string;
  dev?: boolean;
};

/**
 * Connects crash reporting. It needs `EXPO_PUBLIC_SENTRY_DSN`; without it nothing
 * happens, so a build made without a Sentry account still works. Development
 * builds are left alone: there the errors go to the console.
 *
 * Personal data is not sent and performance tracing is off: all this is for is
 * knowing that the app broke and where.
 */
export function initSentry({
  dsn = process.env.EXPO_PUBLIC_SENTRY_DSN,
  dev = __DEV__,
}: Options = {}): boolean {
  if (!dsn || dev) return false;

  Sentry.init({ dsn, sendDefaultPii: false, tracesSampleRate: 0 });

  setErrorReporter((error, context) => {
    Sentry.captureException(error, {
      tags: { source: context.source },
      extra: { key: context.key },
    });
  });

  return true;
}

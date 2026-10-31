import { useEffect } from "react";

import EmptyState from "@/components/ui/EmptyState";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { useT } from "@/i18n";
import { reportError } from "@/lib/report";

interface ErrorFallbackProps {
  error: Error;
  retry: () => void | Promise<void>;
}

/**
 * What the person sees when a screen crashes. It can be drawn outside every
 * provider of the app (the root error boundary), so it relies only on what
 * works with their default values: the device language and the system theme.
 * The technical error is reported, never shown.
 */
const ErrorFallback = ({ error, retry }: ErrorFallbackProps) => {
  const { t } = useT();

  useEffect(() => {
    reportError(error, { source: "boundary" });
  }, [error]);

  return (
    <ScreenContainer testID="screen-error" edges={["top", "bottom"]}>
      <EmptyState
        alert
        icon="alert-circle-outline"
        title={t("errors.boundary.title")}
        description={t("errors.boundary.message")}
        actionLabel={t("common.retry")}
        onAction={() => {
          void retry();
        }}
      />
    </ScreenContainer>
  );
};

export default ErrorFallback;

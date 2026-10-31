import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

import { reportError } from "./report";

/**
 * A query client that reports every failure nobody handled. Screens still show
 * their own error states; this only makes sure the failure is seen by whoever
 * collects errors (see `setErrorReporter`).
 */
export function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) =>
        reportError(error, { source: "query", key: query.queryKey }),
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _result, mutation) =>
        reportError(error, { source: "mutation", key: mutation.options.mutationKey }),
    }),
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        retry: 1,
        refetchOnReconnect: true,
        refetchOnWindowFocus: false,
      },
    },
  });
}

export const queryClient = createQueryClient();

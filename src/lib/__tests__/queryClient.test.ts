import { MutationObserver, QueryClient } from "@tanstack/react-query";

import { createQueryClient, queryClient } from "../queryClient";
import { setErrorReporter } from "../report";

const failing = (message: string) => () => Promise.reject(new Error(message));

describe("createQueryClient", () => {
  // A cache keeps a timer per query (its gcTime); clearing it lets Jest exit.
  const clients: QueryClient[] = [];
  const createClient = () => {
    const client = createQueryClient();
    clients.push(client);
    return client;
  };

  afterEach(() => {
    clients.splice(0).forEach((client) => client.clear());
    setErrorReporter(null);
  });

  it("reports a query that fails, with its key", async () => {
    const reporter = jest.fn();
    setErrorReporter(reporter);

    await createClient()
      .fetchQuery({ queryKey: ["routines", "es"], queryFn: failing("boom"), retry: false })
      .catch(() => {});

    expect(reporter).toHaveBeenCalledTimes(1);
    expect(reporter).toHaveBeenCalledWith(new Error("boom"), {
      source: "query",
      key: ["routines", "es"],
    });
  });

  it("does not report a query that fails in a way the app already explains", async () => {
    const reporter = jest.fn();
    setErrorReporter(reporter);

    await createClient()
      .fetchQuery({ queryKey: ["x"], queryFn: failing("user unavailable"), retry: false })
      .catch(() => {});

    expect(reporter).not.toHaveBeenCalled();
  });

  it("does not report a query that succeeds", async () => {
    const reporter = jest.fn();
    setErrorReporter(reporter);

    await createClient().fetchQuery({ queryKey: ["x"], queryFn: () => Promise.resolve(1) });

    expect(reporter).not.toHaveBeenCalled();
  });

  it("reports a mutation that fails, with its key when it has one", async () => {
    const reporter = jest.fn();
    setErrorReporter(reporter);
    const client = createClient();

    await new MutationObserver(client, {
      mutationKey: ["reorderRoutineExercises", "r1"],
      mutationFn: failing("boom"),
    })
      .mutate()
      .catch(() => {});

    expect(reporter).toHaveBeenCalledTimes(1);
    expect(reporter).toHaveBeenCalledWith(new Error("boom"), {
      source: "mutation",
      key: ["reorderRoutineExercises", "r1"],
    });
  });

  it("does not report a mutation that fails in a way the app already explains", async () => {
    const reporter = jest.fn();
    setErrorReporter(reporter);

    await new MutationObserver(createClient(), { mutationFn: failing("routine 1 has no exercises") })
      .mutate()
      .catch(() => {});

    expect(reporter).not.toHaveBeenCalled();
  });

  it("keeps the caching defaults of the app", () => {
    expect(createClient().getDefaultOptions().queries).toMatchObject({
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    });
  });
});

describe("queryClient", () => {
  it("is the client the app uses", () => {
    expect(queryClient).toBeInstanceOf(QueryClient);
  });
});

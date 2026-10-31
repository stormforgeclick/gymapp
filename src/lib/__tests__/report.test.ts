import { devConsoleReporter, reportError, setErrorReporter } from "../report";

describe("reportError", () => {
  afterEach(() => setErrorReporter(null));

  it("sends an unexpected error and where it happened to the reporter", () => {
    const reporter = jest.fn();
    setErrorReporter(reporter);
    const error = new Error("boom");

    reportError(error, { source: "query", key: ["routines", "es"] });

    expect(reporter).toHaveBeenCalledTimes(1);
    expect(reporter).toHaveBeenCalledWith(error, { source: "query", key: ["routines", "es"] });
  });

  it.each([
    "routine 1 has no exercises",
    'split "Push" already exists',
    "user unavailable",
  ])("does not report %p: the app already explains it to the person", (message) => {
    const reporter = jest.fn();
    setErrorReporter(reporter);

    reportError({ message }, { source: "mutation" });

    expect(reporter).not.toHaveBeenCalled();
  });

  it("turns a database error that is not an Error into one, keeping its message", () => {
    const reporter = jest.fn();
    setErrorReporter(reporter);
    const databaseError = { message: "permission denied for table x", code: "42501" };

    reportError(databaseError, { source: "mutation" });

    const [sent] = reporter.mock.calls[0];
    expect(sent).toBeInstanceOf(Error);
    expect(sent.message).toBe("permission denied for table x");
    expect(sent.cause).toBe(databaseError);
  });

  it.each([
    ["a string", "something broke", "something broke"],
    ["undefined", undefined, "Unknown error"],
  ])("turns %s into an Error", (_label, value, message) => {
    const reporter = jest.fn();
    setErrorReporter(reporter);

    reportError(value, { source: "boundary" });

    expect(reporter.mock.calls[0][0]).toEqual(new Error(message));
  });

  it("does nothing when no reporter is set", () => {
    expect(() => reportError(new Error("boom"), { source: "query" })).not.toThrow();
  });

  it("never throws, even when the reporter does", () => {
    setErrorReporter(() => {
      throw new Error("the reporter is broken");
    });

    expect(() => reportError(new Error("boom"), { source: "query" })).not.toThrow();
  });
});

describe("devConsoleReporter", () => {
  it("prints where the error came from and the error itself", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const error = new Error("boom");

    devConsoleReporter(error, { source: "mutation" });

    expect(warn).toHaveBeenCalledWith("[error:mutation]", error);
    warn.mockRestore();
  });
});

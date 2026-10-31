import { parseDraftSets } from "../parseDraftSets";

describe("parseDraftSets", () => {
  it("turns each draft row into a set with the same min and max reps", () => {
    const result = parseDraftSets([
      { reps: "10", weight: "40" },
      { reps: "8", weight: "42.5" },
    ]);

    expect(result).toEqual({
      sets: [
        { id: undefined, min_reps: 10, max_reps: 10, weight: 40 },
        { id: undefined, min_reps: 8, max_reps: 8, weight: 42.5 },
      ],
    });
  });

  it("keeps the id of rows that already exist", () => {
    const result = parseDraftSets([{ id: "set-1", reps: "10", weight: "" }]);

    expect(result).toEqual({
      sets: [{ id: "set-1", min_reps: 10, max_reps: 10, weight: null }],
    });
  });

  it("reads an empty weight as no weight", () => {
    const result = parseDraftSets([{ reps: "10", weight: "  " }]);

    expect(result).toEqual({
      sets: [{ id: undefined, min_reps: 10, max_reps: 10, weight: null }],
    });
  });

  it("accepts a decimal comma in the weight", () => {
    const result = parseDraftSets([{ reps: "10", weight: "42,5" }]);

    expect(result).toMatchObject({ sets: [{ weight: 42.5 }] });
  });

  it.each(["", "0", "-3", "2.5", "abc"])(
    "reports a reps error for %p",
    (reps) => {
      expect(parseDraftSets([{ reps, weight: "" }])).toEqual({ error: "reps" });
    }
  );

  it.each(["-1", "abc", "1e3"])("reports a weight error for %p", (weight) => {
    expect(parseDraftSets([{ reps: "10", weight }])).toEqual({ error: "weight" });
  });

  it("reports the first problem when several rows are wrong", () => {
    const result = parseDraftSets([
      { reps: "10", weight: "40" },
      { reps: "10", weight: "abc" },
      { reps: "0", weight: "" },
    ]);

    expect(result).toEqual({ error: "weight" });
  });

  it("reports no sets for an empty draft", () => {
    expect(parseDraftSets([])).toEqual({ sets: [] });
  });
});

import type { Routine } from "@/hooks/api/routines/queries";
import type { FinishedWorkout } from "@/hooks/api/workouts/queries";
import { suggestRoutine } from "../suggestRoutine";

const routine = (id: string, quantity = 3): Routine => ({
  id,
  name: `Routine ${id}`,
  color: "#112233",
  quantity,
  tags: [],
  split_id: "split-1",
});

const done = (routine_id: string | null, finished_at: string): FinishedWorkout => ({
  routine_id,
  finished_at,
});

describe("suggestRoutine", () => {
  it("returns null when there are no routines", () => {
    expect(suggestRoutine([], [])).toBeNull();
  });

  it("returns null when every routine is empty", () => {
    expect(suggestRoutine([routine("a", 0), routine("b", 0)], [])).toBeNull();
  });

  it("skips empty routines even when they were never done", () => {
    const routines = [routine("empty", 0), routine("full", 2)];

    expect(suggestRoutine(routines, [])?.id).toBe("full");
  });

  it("picks the first routine in list order when none has ever been done", () => {
    const routines = [routine("a"), routine("b"), routine("c")];

    expect(suggestRoutine(routines, [])?.id).toBe("a");
  });

  it("prefers a routine that was never done over one that was", () => {
    const routines = [routine("a"), routine("b")];
    const finished = [done("a", "2026-10-29T10:00:00Z")];

    expect(suggestRoutine(routines, finished)?.id).toBe("b");
  });

  it("picks the routine finished longest ago", () => {
    const routines = [routine("a"), routine("b"), routine("c")];
    // Newest first, as the query returns them.
    const finished = [
      done("a", "2026-10-29T10:00:00Z"),
      done("c", "2026-10-27T10:00:00Z"),
      done("b", "2026-10-25T10:00:00Z"),
    ];

    expect(suggestRoutine(routines, finished)?.id).toBe("b");
  });

  it("ranks a routine by its latest workout, not an older one", () => {
    const routines = [routine("a"), routine("b")];
    // "a" was done long ago but also yesterday; "b" was done in between.
    const finished = [
      done("a", "2026-10-29T10:00:00Z"),
      done("b", "2026-10-20T10:00:00Z"),
      done("a", "2026-10-01T10:00:00Z"),
    ];

    expect(suggestRoutine(routines, finished)?.id).toBe("b");
  });

  it("keeps the first routine in list order when two share the same last workout time", () => {
    const routines = [routine("a"), routine("b")];
    const finished = [
      done("a", "2026-10-29T10:00:00Z"),
      done("b", "2026-10-29T10:00:00Z"),
    ];

    expect(suggestRoutine(routines, finished)?.id).toBe("a");
  });

  it("ignores workouts that have no routine or belong to unknown routines", () => {
    const routines = [routine("a"), routine("b")];
    const finished = [
      done(null, "2026-10-29T10:00:00Z"),
      done("deleted", "2026-10-28T10:00:00Z"),
      done("a", "2026-10-27T10:00:00Z"),
    ];

    expect(suggestRoutine(routines, finished)?.id).toBe("b");
  });

  it("treats a routine missing from a truncated history as the stalest", () => {
    const routines = [routine("a"), routine("b")];
    const finished = [done("a", "2026-10-29T10:00:00Z")];

    expect(suggestRoutine(routines, finished)?.id).toBe("b");
  });
});

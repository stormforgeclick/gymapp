import { makeSet, makeWorkoutExercise } from "@/test-utils/factories";
import { getResumeIndex } from "../getResumeIndex";

/** An exercise with one set per argument; `true` is a completed set. */
const exercise = (...completed: boolean[]) =>
  makeWorkoutExercise({
    sets: completed.map((done, i) =>
      makeSet({ id: `set-${i}`, position: i + 1, completed: done })
    ),
  });

describe("getResumeIndex", () => {
  it("returns 0 for a workout without exercises", () => {
    expect(getResumeIndex([])).toBe(0);
  });

  it("starts at the first exercise when nothing has been done", () => {
    expect(getResumeIndex([exercise(false), exercise(false)])).toBe(0);
  });

  it("stays on the exercise that is partly done", () => {
    const exercises = [exercise(true, false), exercise(false)];

    expect(getResumeIndex(exercises)).toBe(0);
  });

  it("moves on to the next exercise when the last one touched is complete", () => {
    const exercises = [exercise(true, true), exercise(false, false), exercise(false)];

    expect(getResumeIndex(exercises)).toBe(1);
  });

  it("resumes after the last exercise touched, not at an earlier skipped one", () => {
    const exercises = [
      exercise(false), // skipped
      exercise(true, true), // done
      exercise(true, false), // last touched, still pending
      exercise(false),
    ];

    expect(getResumeIndex(exercises)).toBe(2);
  });

  it("goes back to a skipped exercise when nothing is pending ahead", () => {
    const exercises = [exercise(false), exercise(true), exercise(true)];

    expect(getResumeIndex(exercises)).toBe(0);
  });

  it("lands on the last exercise when the whole workout is complete", () => {
    const exercises = [exercise(true), exercise(true, true), exercise(true)];

    expect(getResumeIndex(exercises)).toBe(2);
  });

  it("does not treat an exercise without sets as pending", () => {
    const exercises = [exercise(true), exercise(), exercise(false)];

    expect(getResumeIndex(exercises)).toBe(2);
  });
});

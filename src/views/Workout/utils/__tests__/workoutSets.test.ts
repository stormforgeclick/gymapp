import { makeSet, makeWorkoutExercise } from "@/test-utils/factories";
import { countSets, nextSetDefaults } from "../workoutSets";

describe("countSets", () => {
  it("counts zero for a workout without exercises", () => {
    expect(countSets([])).toEqual({ done: 0, total: 0 });
  });

  it("counts completed and total sets across every exercise", () => {
    const exercises = [
      makeWorkoutExercise({
        id: "a",
        sets: [
          makeSet({ id: "a1", completed: true }),
          makeSet({ id: "a2", completed: false }),
        ],
      }),
      makeWorkoutExercise({
        id: "b",
        sets: [makeSet({ id: "b1", completed: true })],
      }),
      makeWorkoutExercise({ id: "c", sets: [] }),
    ];

    expect(countSets(exercises)).toEqual({ done: 2, total: 3 });
  });
});

describe("nextSetDefaults", () => {
  it("starts at position 1 with nothing filled in for an exercise without sets", () => {
    const exercise = makeWorkoutExercise({ sets: [] });

    expect(nextSetDefaults(exercise)).toEqual({
      position: 1,
      weight: null,
      reps: null,
    });
  });

  it("copies the weight and reps of the last set", () => {
    const exercise = makeWorkoutExercise({
      sets: [
        makeSet({ id: "s1", position: 1, weight: 40, reps: 12 }),
        makeSet({ id: "s2", position: 2, weight: 50, reps: 10 }),
      ],
    });

    expect(nextSetDefaults(exercise)).toEqual({
      position: 3,
      weight: 50,
      reps: 10,
    });
  });

  it("falls back to the planned reps when the last set has none", () => {
    const exercise = makeWorkoutExercise({
      sets: [makeSet({ position: 1, weight: 30, reps: null, target_min_reps: 8 })],
    });

    expect(nextSetDefaults(exercise).reps).toBe(8);
  });

  it("leaves reps empty when the last set has neither reps nor a plan", () => {
    const exercise = makeWorkoutExercise({
      sets: [makeSet({ reps: null, target_min_reps: null })],
    });

    expect(nextSetDefaults(exercise).reps).toBeNull();
  });

  it("does not borrow the weight of an earlier set when the last one has none", () => {
    const exercise = makeWorkoutExercise({
      sets: [
        makeSet({ id: "s1", position: 1, weight: 40, reps: 10 }),
        makeSet({ id: "s2", position: 2, weight: null, reps: 10 }),
      ],
    });

    expect(nextSetDefaults(exercise).weight).toBeNull();
  });

  it("goes one past the highest position, even when the sets are not in order", () => {
    const exercise = makeWorkoutExercise({
      sets: [
        makeSet({ id: "s1", position: 5 }),
        makeSet({ id: "s2", position: 2 }),
      ],
    });

    expect(nextSetDefaults(exercise).position).toBe(6);
  });
});

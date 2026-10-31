import { makeSet, makeWorkoutExercise } from "@/test-utils/factories";
import { appendSet, applySetPatch, removeSet } from "../cache";

const exercises = () => [
  makeWorkoutExercise({
    id: "we-1",
    sets: [
      makeSet({ id: "s1", position: 1, weight: 40, reps: 10 }),
      makeSet({ id: "s2", position: 2, weight: 40, reps: 10 }),
    ],
  }),
  makeWorkoutExercise({
    id: "we-2",
    sets: [makeSet({ id: "s3", position: 1, weight: 20, reps: 12 })],
  }),
];

describe("applySetPatch", () => {
  it("changes only the fields in the patch, on the matching set", () => {
    const result = applySetPatch(exercises(), "s2", { weight: 45, completed: true });

    expect(result[0].sets[1]).toMatchObject({
      id: "s2",
      weight: 45,
      completed: true,
      reps: 10,
    });
  });

  it("leaves every other set as it was", () => {
    const result = applySetPatch(exercises(), "s2", { weight: 45 });

    expect(result[0].sets[0]).toEqual(exercises()[0].sets[0]);
    expect(result[1]).toEqual(exercises()[1]);
  });

  it("can clear a value", () => {
    const result = applySetPatch(exercises(), "s1", { weight: null });

    expect(result[0].sets[0].weight).toBeNull();
  });

  it("does not change the exercises it was given", () => {
    const original = exercises();

    applySetPatch(original, "s1", { weight: 99 });

    expect(original).toEqual(exercises());
  });

  it("returns the same exercises when the set does not exist", () => {
    expect(applySetPatch(exercises(), "missing", { weight: 99 })).toEqual(
      exercises()
    );
  });
});

describe("removeSet", () => {
  it("removes the matching set from its exercise", () => {
    const result = removeSet(exercises(), "s1");

    expect(result[0].sets.map((set) => set.id)).toEqual(["s2"]);
  });

  it("keeps the other exercises untouched", () => {
    const result = removeSet(exercises(), "s1");

    expect(result[1]).toEqual(exercises()[1]);
  });

  it("does not change the exercises it was given", () => {
    const original = exercises();

    removeSet(original, "s1");

    expect(original).toEqual(exercises());
  });

  it("returns the same exercises when the set does not exist", () => {
    expect(removeSet(exercises(), "missing")).toEqual(exercises());
  });
});

describe("appendSet", () => {
  it("adds the set at the end of the matching exercise", () => {
    const created = makeSet({ id: "new", position: 3 });

    const result = appendSet(exercises(), "we-1", created);

    expect(result[0].sets.map((set) => set.id)).toEqual(["s1", "s2", "new"]);
  });

  it("does not touch the other exercises", () => {
    const result = appendSet(exercises(), "we-1", makeSet({ id: "new" }));

    expect(result[1]).toEqual(exercises()[1]);
  });

  it("does not change the exercises it was given", () => {
    const original = exercises();

    appendSet(original, "we-1", makeSet({ id: "new" }));

    expect(original).toEqual(exercises());
  });
});

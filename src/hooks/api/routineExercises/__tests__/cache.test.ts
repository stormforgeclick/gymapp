import { makeRoutineExercise } from "@/test-utils/factories";
import { reorderByIds } from "../cache";

const exercises = () => [
  makeRoutineExercise({ id: "a", position: 1, name: "Squat" }),
  makeRoutineExercise({ id: "b", position: 2, name: "Bench" }),
  makeRoutineExercise({ id: "c", position: 3, name: "Row" }),
];

describe("reorderByIds", () => {
  it("returns the exercises in the order of the ids", () => {
    const result = reorderByIds(exercises(), ["c", "a", "b"]);

    expect(result.map((exercise) => exercise.id)).toEqual(["c", "a", "b"]);
  });

  it("renumbers the positions from 1", () => {
    const result = reorderByIds(exercises(), ["c", "a", "b"]);

    expect(result.map((exercise) => exercise.position)).toEqual([1, 2, 3]);
  });

  it("keeps everything else about each exercise", () => {
    const result = reorderByIds(exercises(), ["b", "a", "c"]);

    expect(result[0]).toMatchObject({ id: "b", name: "Bench" });
  });

  it("skips ids that are not in the list", () => {
    const result = reorderByIds(exercises(), ["b", "ghost", "a", "c"]);

    expect(result.map((exercise) => exercise.id)).toEqual(["b", "a", "c"]);
    expect(result.map((exercise) => exercise.position)).toEqual([1, 2, 3]);
  });

  it("does not change the exercises it was given", () => {
    const original = exercises();

    reorderByIds(original, ["c", "b", "a"]);

    expect(original).toEqual(exercises());
  });
});

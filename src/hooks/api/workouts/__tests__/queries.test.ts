import { supabase } from "@/lib/supabase";
import { addWorkoutSet } from "../queries";

jest.mock("@/lib/supabase", () => ({ supabase: { from: jest.fn() } }));

const from = supabase.from as unknown as jest.Mock;

/** Stands in for `from("workout_sets").insert(...).select(...).single()`. */
const stubInsert = (result: { data: unknown; error: unknown }) => {
  const single = jest.fn().mockResolvedValue(result);
  const select = jest.fn(() => ({ single }));
  const insert = jest.fn(() => ({ select }));
  from.mockReturnValue({ insert });
  return insert;
};

const created = { id: "new", position: 3, weight: 50, reps: 8, completed: false };

describe("addWorkoutSet", () => {
  beforeEach(() => from.mockReset());

  it("saves the set in the exercise and position it was given", async () => {
    const insert = stubInsert({ data: created, error: null });

    await addWorkoutSet({ workoutExerciseId: "we-1", position: 3, weight: 50, reps: 8 });

    expect(from).toHaveBeenCalledWith("workout_sets");
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ workout_exercise_id: "we-1", position: 3, weight: 50, reps: 8 })
    );
  });

  it("saves a new set as pending when nothing says otherwise", async () => {
    const insert = stubInsert({ data: created, error: null });

    await addWorkoutSet({ workoutExerciseId: "we-1", position: 3, weight: 50, reps: 8 });

    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ completed: false }));
  });

  // Undoing a delete has to bring back a set that was already marked done.
  it("saves the set as done when it is given as done", async () => {
    const insert = stubInsert({ data: { ...created, completed: true }, error: null });

    await addWorkoutSet({
      workoutExerciseId: "we-1",
      position: 3,
      weight: 50,
      reps: 8,
      completed: true,
    });

    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ completed: true }));
  });

  it("returns the saved set, still without planned reps", async () => {
    stubInsert({ data: created, error: null });

    await expect(
      addWorkoutSet({ workoutExerciseId: "we-1", position: 3, weight: 50, reps: 8 })
    ).resolves.toEqual({ ...created, target_min_reps: null, target_max_reps: null });
  });

  it("throws the error the database answers, so the caller can say it failed", async () => {
    stubInsert({ data: null, error: new Error("boom") });

    await expect(
      addWorkoutSet({ workoutExerciseId: "we-1", position: 3, weight: 50, reps: 8 })
    ).rejects.toThrow("boom");
  });
});

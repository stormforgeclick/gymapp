import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { supabase } from "@/lib/supabase";
import { makeSet, makeWorkoutExercise } from "@/test-utils/factories";
import { useRestoreWorkoutSet } from "..";
import type { WorkoutExercise } from "../queries";

jest.mock("@/lib/supabase", () => ({ supabase: { from: jest.fn() } }));

const from = supabase.from as unknown as jest.Mock;

type Payload = { position: number; weight: number | null; reps: number | null; completed: boolean };

/** Stands in for `from("workout_sets").insert(...).select(...).single()`, answering with the row it was given. */
const stubInsert = (error: Error | null = null) => {
  const insert = jest.fn((payload: Payload) => ({
    select: () => ({
      single: () =>
        Promise.resolve(
          error
            ? { data: null, error }
            : { data: { id: "restored-id", ...payload }, error: null }
        ),
    }),
  }));
  from.mockReturnValue({ insert });
  return insert;
};

const key = ["workoutExercises", "w1", "es"];

// The set the person deleted: the last one, already done, with a planned range.
const deleted = makeSet({
  id: "deleted-id",
  position: 3,
  weight: 50,
  reps: 8,
  completed: true,
  target_min_reps: 6,
  target_max_reps: 8,
});

const exerciseWith = (...positions: number[]) =>
  makeWorkoutExercise({
    id: "we-1",
    sets: positions.map((position) => makeSet({ id: `s${position}`, position })),
  });

describe("useRestoreWorkoutSet", () => {
  // A cache keeps a timer per query (its gcTime); clearing it lets Jest exit.
  let client: QueryClient;
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const cached = () => client.getQueryData<WorkoutExercise[]>(key)?.[0].sets ?? [];

  const setup = (exercise: WorkoutExercise) => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(key, [exercise]);
    return renderHook(() => useRestoreWorkoutSet("w1", "es"), { wrapper });
  };

  beforeEach(() => from.mockReset());
  afterEach(() => client.clear());

  it("saves the set again in its own position, with what it had", async () => {
    const insert = stubInsert();
    const { result } = await setup(exerciseWith(1, 2));

    await act(() => result.current.mutateAsync({ workoutExerciseId: "we-1", set: deleted }));

    expect(from).toHaveBeenCalledWith("workout_sets");
    expect(insert).toHaveBeenCalledWith({
      workout_exercise_id: "we-1",
      position: 3,
      weight: 50,
      reps: 8,
      completed: true,
    });
  });

  it("shows the set again with its planned reps", async () => {
    stubInsert();
    const { result } = await setup(exerciseWith(1, 2));

    await act(() => result.current.mutateAsync({ workoutExerciseId: "we-1", set: deleted }));

    expect(cached().map((set) => set.position)).toEqual([1, 2, 3]);
    expect(cached()[2]).toMatchObject({
      id: "restored-id",
      weight: 50,
      reps: 8,
      completed: true,
      target_min_reps: 6,
      target_max_reps: 8,
    });
  });

  it("puts the set after the last one when another set took its position", async () => {
    const insert = stubInsert();
    const { result } = await setup(exerciseWith(1, 2, 3));

    await act(() => result.current.mutateAsync({ workoutExerciseId: "we-1", set: deleted }));

    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ position: 4 }));
  });

  // The planned reps belong to a position, so a set that moved cannot keep them.
  it("does not carry the planned reps to a different position", async () => {
    stubInsert();
    const { result } = await setup(exerciseWith(1, 2, 3));

    await act(() => result.current.mutateAsync({ workoutExerciseId: "we-1", set: deleted }));

    expect(cached()[3]).toMatchObject({ position: 4, target_min_reps: null, target_max_reps: null });
  });

  it("leaves the table as it was and rejects when the database refuses", async () => {
    stubInsert(new Error("workout already finished"));
    const { result } = await setup(exerciseWith(1, 2));

    await expect(
      act(() => result.current.mutateAsync({ workoutExerciseId: "we-1", set: deleted }))
    ).rejects.toThrow("workout already finished");

    expect(cached().map((set) => set.id)).toEqual(["s1", "s2"]);
  });
});

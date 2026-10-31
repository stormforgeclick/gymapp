import { supabase } from "@/lib/supabase";
import { getExercisesFilters } from "../queries";

jest.mock("@/lib/supabase", () => ({ supabase: { rpc: jest.fn() } }));

const rpc = supabase.rpc as unknown as jest.Mock;

describe("getExercisesFilters", () => {
  beforeEach(() => rpc.mockReset());

  it("asks the database for the filters in the given language", async () => {
    rpc.mockResolvedValue({ data: [], error: null });

    await getExercisesFilters("en");

    expect(rpc).toHaveBeenCalledWith("get_exercise_filters", { p_language: "en" });
  });

  it("returns what the database answers", async () => {
    const filters = [{ type: "category", id: "1", name: "Strength" }];
    rpc.mockResolvedValue({ data: filters, error: null });

    await expect(getExercisesFilters("es")).resolves.toEqual(filters);
  });

  it("throws the error the database answers, so the query can report it", async () => {
    rpc.mockResolvedValue({ data: null, error: new Error("boom") });

    await expect(getExercisesFilters("es")).rejects.toThrow("boom");
  });
});

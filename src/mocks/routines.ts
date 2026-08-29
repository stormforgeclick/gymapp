import type { IRoutineResponse } from "@/types/routine";

export const routinesMock: IRoutineResponse[] = [
  {
    id: "1",
    name: "Leg Day",
    quantity: 5,
    tags: ["LEGS", "QUADS", "HAMSTRINGS"],
    color: "#FF6B6B",
  },
  {
    id: "2",
    name: "Pull Day",
    quantity: 4,
    tags: ["BACK", "BICEPS"],
    color: "#4ECDC4",
  },
  {
    id: "3",
    name: "Push Day",
    quantity: 6,
    tags: ["CHEST", "SHOULDERS", "TRICEPS"],
    color: "#45B7D1",
  },
];

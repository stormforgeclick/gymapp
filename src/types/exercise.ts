export interface IExerciseData {
  id: string;
  tag: string;
  name: string;
}

export interface IRoutineExerciseData {
  id: string;
  routineId: string;
  exerciseId: string;
  sets: number;
  minReps: number;
  maxReps: number;
  weight: number;
}

export interface IRoutineExerciseResponse extends IExerciseData {
  exerciseRoutineDetail: IRoutineExerciseData;
}

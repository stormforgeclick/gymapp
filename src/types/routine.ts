export interface IRoutineData {
  id: string;
  name: string;
  color: string;
}

export interface IRoutineResponse extends IRoutineData {
  quantity: number;
  tags: string[];
}

import { useLocalSearchParams } from "expo-router";

const RoutineDetail = () => {
  const { id } = useLocalSearchParams<{ id: string }>();

  console.log(id);

  return <></>;
};

export default RoutineDetail;

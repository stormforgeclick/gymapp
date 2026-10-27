import Skeleton from "@/components/ui/Skeleton";
import { StyleSheet, View } from "react-native";

const FilterSkeleton = () => {
  return (
    <View style={styles.filterSkeletonContainer}>
      <Skeleton variant="pill" style={styles.filterSkeleton} />
      <Skeleton variant="pill" style={[styles.filterSkeleton, { width: 90 }]} />
      <Skeleton
        variant="pill"
        style={[styles.filterSkeleton, { width: 110 }]}
      />
      <Skeleton variant="pill" style={[styles.filterSkeleton, { width: 80 }]} />
      <Skeleton
        variant="pill"
        style={[styles.filterSkeleton, { width: 100 }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  filterSkeletonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  filterSkeleton: {
    width: 70,
    height: 36,
  },
});

export default FilterSkeleton;

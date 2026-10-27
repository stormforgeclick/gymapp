import { ComponentType } from "react";
import {
  FlatList,
  FlatListProps,
  ListRenderItem,
  RefreshControl,
  View,
} from "react-native";

import EmptyState from "@/components/ui/EmptyState";
import { useTheme } from "@/hooks/use-theme";
import { useT } from "@/i18n";
import ExerciseCard from "./ExerciseCard";
import ExerciseCardSkeleton from "./ExerciseCardSkeleton";

type Exercise = {
  id: string;
  name: string;
  category: string;
  equipment: string;
  image: string;
};

type ListComponentType = ComponentType<FlatListProps<Exercise>>;

interface ExercisesListProps {
  exercises: Exercise[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  fetchNextPage: () => void;
  /** The first page failed to load: show an error with a retry action. */
  isError?: boolean;
  onRetry?: () => void;
  /** Pull-to-refresh. Leave `onRefresh` unset inside bottom sheets. */
  refreshing?: boolean;
  onRefresh?: () => void;
  ListComponent?: ListComponentType;
  renderItem?: ListRenderItem<Exercise>;
  ListHeaderComponent?: FlatListProps<Exercise>["ListHeaderComponent"];
  stickyHeaderIndices?: FlatListProps<Exercise>["stickyHeaderIndices"];
  contentContainerStyle?: FlatListProps<Exercise>["contentContainerStyle"];
}

const SKELETON_DATA: Exercise[] = Array.from({ length: 6 }, (_, index) => ({
  id: `skeleton-${index}`,
  name: "",
  category: "",
  equipment: "",
  image: "",
}));

const defaultRenderItem: ListRenderItem<Exercise> = ({ item }) => (
  <ExerciseCard exercise={item} />
);

const ExercisesList = ({
  exercises,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  fetchNextPage,
  isError = false,
  onRetry,
  refreshing = false,
  onRefresh,
  ListComponent,
  renderItem = defaultRenderItem,
  ListHeaderComponent,
  stickyHeaderIndices,
  contentContainerStyle,
}: ExercisesListProps) => {
  const List = (ListComponent ?? FlatList) as ListComponentType;
  const theme = useTheme();
  const { t } = useT();

  if (isLoading) {
    return (
      <List
        data={SKELETON_DATA}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          { gap: 12, paddingBottom: 16 },
          contentContainerStyle,
        ]}
        ListHeaderComponent={ListHeaderComponent}
        stickyHeaderIndices={stickyHeaderIndices}
        renderItem={() => <ExerciseCardSkeleton />}
      />
    );
  }

  return (
    <List
      data={exercises}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[
        { gap: 12, paddingBottom: 16 },
        contentContainerStyle,
      ]}
      ListHeaderComponent={ListHeaderComponent}
      stickyHeaderIndices={stickyHeaderIndices}
      renderItem={renderItem}
      removeClippedSubviews
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }}
      onEndReachedThreshold={0.5}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accentText}
            colors={[theme.accentText]}
            progressBackgroundColor={theme.surface}
          />
        ) : undefined
      }
      ListEmptyComponent={
        isError ? (
          <EmptyState
            alert
            icon="alert-circle-outline"
            title={t("exercises.loadError")}
            actionLabel={t("common.retry")}
            onAction={onRetry}
          />
        ) : (
          <EmptyState
            icon="magnify"
            title={t("exercises.noResults")}
            description={t("exercises.noResultsHint")}
          />
        )
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={{ gap: 12 }}>
            <ExerciseCardSkeleton />
            <ExerciseCardSkeleton />
          </View>
        ) : null
      }
    />
  );
};

export default ExercisesList;

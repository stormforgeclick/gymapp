import { useCallback, useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { ThemedText } from "@/components/themed-text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const ROUTINE_BACKGROUND = "#0F0F1C";

interface IProps {
  setShowAdd: (status: boolean) => void;
}

const AddRoutineComponent = ({ setShowAdd }: IProps) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { bottom } = useSafeAreaInsets();

  useEffect(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleDismiss = () => {
    setShowAdd(false);
  };

  const handleSheetChanges = useCallback((index: number) => {
    console.log("handleSheetChanges", index);
  }, []);

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      onChange={handleSheetChanges}
      onDismiss={handleDismiss}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.contentContainer}>
        <View
          style={{
            paddingBottom: bottom,
          }}
        >
          <ThemedText style={styles.title}>NEW ROUTINE</ThemedText>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    backgroundColor: ROUTINE_BACKGROUND,
  },

  handleIndicator: {
    backgroundColor: "#666",
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    backgroundColor: ROUTINE_BACKGROUND,
  },
  title: {
    fontSize: 28,
    fontFamily: "BarlowCondensed_900Black",
  },
});

export default AddRoutineComponent;

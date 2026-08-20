import { useCallback, useEffect, useRef, useState } from "react";
import { View, StyleSheet, Pressable, useColorScheme } from "react-native";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { ThemedText } from "@/components/themed-text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, RoutineColors } from "@/constants/theme";
import { TextInput } from "react-native-gesture-handler";

const ROUTINE_BACKGROUND = "#0F0F1C";

interface IProps {
  setShowAdd: (status: boolean) => void;
}

const AddRoutineComponent = ({ setShowAdd }: IProps) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];
  const { bottom } = useSafeAreaInsets();

  const [name, setName] = useState<string>();
  const [selectedColor, setSelectedColor] =
    useState<keyof typeof RoutineColors>("routineOne");

  useEffect(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleDismiss = () => {
    setShowAdd(false);
  };

  const handleCreateRoutine = () => {
    const color = RoutineColors[selectedColor];
    console.log(name, color);
  };

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      onDismiss={handleDismiss}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.container}>
        <View style={[styles.contentContainer, { paddingBottom: bottom }]}>
          <ThemedText style={styles.title}>NEW ROUTINE</ThemedText>

          <View>
            <ThemedText style={styles.textHeader}>ROUTINE NAME</ThemedText>
            <TextInput
              style={styles.textInput}
              placeholder="Upper, Chest Day, etc. ..."
              placeholderTextColor="#6A6A80"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.colorSection}>
            <ThemedText style={styles.textHeader}>COLOR</ThemedText>

            <View style={styles.colorsContainer}>
              {Object.entries(RoutineColors).map(([name, color]) => (
                <Pressable
                  key={name}
                  onPress={() =>
                    setSelectedColor(name as keyof typeof RoutineColors)
                  }
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === name && styles.selectedColor,
                  ]}
                />
              ))}
            </View>
          </View>

          <Pressable
            style={[styles.button, { backgroundColor: colors.icon }]}
            onPress={handleCreateRoutine}
          >
            <ThemedText style={styles.buttonText}>Create Routine</ThemedText>
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  background: {
    backgroundColor: ROUTINE_BACKGROUND,
  },
  handleIndicator: {
    backgroundColor: "#666",
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: ROUTINE_BACKGROUND,
  },

  contentContainer: {
    gap: 24,
  },

  title: {
    fontSize: 28,
    fontFamily: "BarlowCondensed_900Black",
  },
  textHeader: {
    textAlign: "left",
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 1,
    color: "#6A6A80",
  },

  textInput: {
    marginTop: 8,
    height: 36,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#1C1C2A",
    color: "#FFFFFF",
    fontSize: 13,
  },

  colorSection: {
    gap: 12,
  },

  colorsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },

  selectedColor: {
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  button: {
    borderRadius: 4,
    padding: 16,
    alignItems: "center",
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    lineHeight: 16,
    fontFamily: "Inter_700Bold",
  },
});

export default AddRoutineComponent;

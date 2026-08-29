import { Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";

type FilterButtonProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
};

const FilterButton = ({
  label,
  selected = false,
  onPress,
}: FilterButtonProps) => {
  const capitalizeWords = (text: string) =>
    text.replace(/\b\w/g, (char) => char.toUpperCase());
  const upperCaseLabel = capitalizeWords(label);
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.button,
        !selected && styles.buttonDefault,
        selected && styles.buttonSelected,
      ]}
    >
      <ThemedText
        style={[
          styles.text,
          !selected && styles.textDefault,
          selected && styles.textSelected,
        ]}
        type="semiBold"
      >
        {upperCaseLabel}
      </ThemedText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 24,
    width: "auto",
  },
  buttonDefault: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  buttonSelected: {
    backgroundColor: "#C8FF00",
  },

  text: {},
  textDefault: {
    color: "#6A6A80",
  },
  textSelected: {
    color: "#000000",
  },
});

export default FilterButton;

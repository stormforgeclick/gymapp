import { StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";

interface IProps {
  label: string;
  backgroundColor?: string;
  textColor?: string;
}

const Pill = ({
  label,
  backgroundColor = "#2C2F26",
  textColor = "#8D9383",
}: IProps) => {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
        },
      ]}
    >
      <ThemedText
        style={[
          styles.text,
          {
            color: textColor,
          },
        ]}
      >
        {label}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    borderRadius: 999,
    alignSelf: "flex-start",
  },

  text: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});

export default Pill;

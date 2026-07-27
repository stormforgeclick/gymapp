import { StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";

interface IProps {
  label: string;
  backgroundColor?: string;
  textColor?: string;
}

const Pill = ({ label, backgroundColor, textColor = "#6A6A80" }: IProps) => {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: `${backgroundColor}14`,
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
        type="small"
      >
        {label}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 25,
  },
  text: {
    fontSize: 11,
  },
});

export default Pill;

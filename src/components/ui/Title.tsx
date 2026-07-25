import { StyleSheet } from "react-native";
import { ThemedText } from "../themed-text";
import { ThemedView } from "../themed-view";

interface IProps {
  title: string;
  subtitle?: string;
  stylesProps?: StyleMedia;
}

const Title = ({ title, subtitle, stylesProps }: IProps) => {
  return (
    <ThemedView style={(styles.titleSection, { ...stylesProps })}>
      {subtitle && (
        <ThemedText style={styles.textheader}>{subtitle}</ThemedText>
      )}
      <ThemedText type="title" style={styles.title}>
        {title}
      </ThemedText>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  titleSection: {
    marginTop: 10,
  },

  textheader: {
    textAlign: "left",
    opacity: 0.6,
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 1,
    color: "#6A6A80",
  },

  title: {
    textAlign: "left",
  },
});

export default Title;

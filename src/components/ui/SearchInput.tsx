import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { useDebounce } from "@/hooks/utils/useDebounce";

type SearchInputProps = {
  value?: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

const SearchInput = ({
  value = "",
  onChangeText,
  placeholder = "Search...",
}: SearchInputProps) => {
  const [inputValue, setInputValue] = useState(value);

  const debouncedValue = useDebounce(inputValue, 300);

  useEffect(() => {
    onChangeText(debouncedValue);
  }, [debouncedValue, onChangeText]);

  return (
    <View style={styles.container}>
      <Ionicons name="search-outline" size={24} style={styles.icon} />

      <TextInput
        value={inputValue}
        onChangeText={setInputValue}
        placeholder={placeholder}
        placeholderTextColor="#6A6A80"
        style={styles.input}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#15151C",

    borderRadius: 14,

    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  icon: {
    color: "#77778D",
    marginRight: 24,
  },

  input: {
    flex: 1,
    width: "100%",

    color: "#6A6A80",

    paddingVertical: 0,

    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});

export default SearchInput;

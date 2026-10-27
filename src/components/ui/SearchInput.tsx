import { ComponentType, useEffect, useState } from "react";
import { TextInputProps } from "react-native";

import TextField from "@/components/ui/TextField";
import { useDebounce } from "@/hooks/utils/useDebounce";
import { useT } from "@/i18n";

type SearchInputProps = {
  value?: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  TextInputComponent?: ComponentType<TextInputProps>;
};

const SearchInput = ({
  value = "",
  onChangeText,
  placeholder,
  TextInputComponent,
}: SearchInputProps) => {
  const { t } = useT();
  const [inputValue, setInputValue] = useState(value);

  const debouncedValue = useDebounce(inputValue, 300);

  useEffect(() => {
    onChangeText(debouncedValue);
  }, [debouncedValue, onChangeText]);

  return (
    <TextField
      icon="magnify"
      value={inputValue}
      onChangeText={setInputValue}
      placeholder={placeholder ?? `${t("exercises.search")}...`}
      accessibilityLabel={t("exercises.search")}
      returnKeyType="search"
      clearButtonMode="while-editing"
      TextInputComponent={TextInputComponent}
    />
  );
};

export default SearchInput;

import Skeleton from "@/components/ui/Skeleton";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, ImageProps } from "expo-image";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { IconSize } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const CustomImage = ({
  onLoad,
  onLoadStart,
  onError,
  ...props
}: ImageProps) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <MaterialCommunityIcons
          name="image-broken-variant"
          size={IconSize.lg}
          color={theme.textTertiary}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading && <Skeleton variant="image" style={StyleSheet.absoluteFill} />}

      <Image
        {...props}
        cachePolicy="memory-disk"
        transition={200}
        onLoadStart={() => {
          setLoading(true);
          onLoadStart?.();
        }}
        onLoad={(event) => {
          setLoading(false);
          onLoad?.(event);
        }}
        onError={(event) => {
          setHasError(true);
          setLoading(false);
          onError?.(event);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
});

export default CustomImage;

import Skeleton from "@/components/ui/Skeleton";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, ImageProps } from "expo-image";
import { useState } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { IconSize } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/**
 * `style` sizes the wrapper and the image fills it. Sizing the image itself
 * made percentage widths/heights resolve against a wrapper with no size, so
 * the image collapsed to nothing.
 */
const CustomImage = ({
  style,
  onLoad,
  onLoadStart,
  onError,
  ...props
}: ImageProps) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const containerStyle = [styles.container, style as StyleProp<ViewStyle>];

  if (hasError) {
    return (
      <View style={[containerStyle, styles.centered]}>
        <MaterialCommunityIcons
          name="image-broken-variant"
          size={IconSize.lg}
          color={theme.textTertiary}
        />
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      {loading && <Skeleton variant="image" style={StyleSheet.absoluteFill} />}

      <Image
        {...props}
        style={StyleSheet.absoluteFill}
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
    overflow: "hidden",
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default CustomImage;

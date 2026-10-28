import { Image } from "expo-image";
import { useState } from "react";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { type ThemeColors } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { getInitials } from "@/lib/text";

interface AvatarProps {
  /** Photo to show; the initials stand in when it is missing or fails to load. */
  uri?: string | null;
  /** Person's name, for the initials and for screen readers. */
  name: string;
  size?: number;
}

const makeStyles = (c: ThemeColors) => ({
  circle: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    overflow: "hidden" as const,
    backgroundColor: c.surfaceInput,
    borderWidth: 1,
    borderColor: c.border,
  },
});

const Avatar = ({ uri, name, size = 48 }: AvatarProps) => {
  const styles = useThemedStyles(makeStyles);
  const [failedUri, setFailedUri] = useState<string | null>(null);

  const showImage = !!uri && uri !== failedUri;

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={name}
    >
      {showImage ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={150}
          onError={() => setFailedUri(uri)}
        />
      ) : (
        <ThemedText
          type="title"
          tone="secondary"
          style={{ fontSize: size * 0.4, lineHeight: size * 0.5 }}
        >
          {getInitials(name) || "?"}
        </ThemedText>
      )}
    </View>
  );
};

export default Avatar;

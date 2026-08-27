import Skeleton from "@/components/ui/Skeleton";
import { Image, ImageProps } from "expo-image";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

const CustomImage = ({
  onLoad,
  onLoadStart,
  onError,
  ...props
}: ImageProps) => {
  const [loading, setLoading] = useState(true);

  return (
    <View style={styles.container}>
      {loading && <Skeleton variant="image" style={StyleSheet.absoluteFill} />}

      <Image
        {...props}
        onLoadStart={() => {
          setLoading(true);
          onLoadStart?.();
        }}
        onLoad={(event) => {
          setLoading(false);
          onLoad?.(event);
        }}
        onError={(event) => {
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

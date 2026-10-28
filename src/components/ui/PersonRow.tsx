import { ReactNode } from "react";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import Avatar from "@/components/ui/Avatar";
import { Opacity, Radius, Spacing, type ThemeColors } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useT } from "@/i18n";
import { displayName } from "@/lib/profile";

type PersonLike = {
  first_name: string | null;
  last_name: string | null;
  user_name: string | null;
  avatar_url: string | null;
};

interface PersonRowProps {
  person: PersonLike;
  /** Opens the person's profile. */
  onPress?: () => void;
  /** Actions on the right; kept outside the pressable area so they get their own taps. */
  trailing?: ReactNode;
}

const makeStyles = (c: ThemeColors) => ({
  container: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.two,
    padding: Spacing.tight,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  main: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.tight,
  },
  texts: {
    flex: 1,
  },
});

const PersonRow = ({ person, onPress, trailing }: PersonRowProps) => {
  const styles = useThemedStyles(makeStyles);
  const { t } = useT();

  const name = displayName(person) ?? t("profile.noName");
  const handle = person.user_name ? `@${person.user_name}` : null;

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? "button" : undefined}
        accessibilityLabel={
          onPress ? t("gymbros.openProfileA11y", { name }) : undefined
        }
        style={({ pressed }) => [
          styles.main,
          pressed && { opacity: Opacity.pressed },
        ]}
      >
        <Avatar uri={person.avatar_url} name={name} size={48} />

        <View style={styles.texts}>
          <ThemedText type="bodyStrong" numberOfLines={1}>
            {name}
          </ThemedText>
          {handle && handle !== name && (
            <ThemedText type="caption" tone="secondary" numberOfLines={1}>
              {handle}
            </ThemedText>
          )}
        </View>
      </Pressable>

      {trailing}
    </View>
  );
};

export default PersonRow;

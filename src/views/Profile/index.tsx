import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import IconButton from "@/components/ui/IconButton";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import ScreenHeader from "@/components/ui/ScreenHeader";
import Section from "@/components/ui/Section";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Skeleton from "@/components/ui/Skeleton";
import { IconSize, Opacity, Spacing, type ThemeColors } from "@/constants/theme";
import {
  useMyProfile,
  useRemoveAvatar,
  useUpdateProfile,
  useUploadAvatar,
} from "@/hooks/api/profile";
import type { ProfilePrivacy } from "@/hooks/api/profile/queries";
import { useSetSplitPrivacy, useSplits } from "@/hooks/api/splits";
import type { SplitPrivacy } from "@/hooks/api/splits/queries";
import { useTheme } from "@/hooks/use-theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useT } from "@/i18n";
import { displayName } from "@/lib/profile";
import { useDialog } from "@/providers/DialogProvider";
import { useToast } from "@/providers/ToastProvider";
import SplitSharingRow from "./components/SplitSharingRow";

const AVATAR_SIZE = 96;

const makeStyles = (c: ThemeColors) => ({
  content: {
    gap: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
  },
  identity: {
    alignItems: "center" as const,
    gap: Spacing.tight,
  },
  avatarButton: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  cameraBadge: {
    position: "absolute" as const,
    right: -Spacing.half,
    bottom: -Spacing.half,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: c.primary,
    borderWidth: 2,
    borderColor: c.background,
  },
  names: {
    alignItems: "center" as const,
    gap: Spacing.half,
  },
  centered: {
    textAlign: "center" as const,
  },
  usernamePrompt: {
    minHeight: 44,
    justifyContent: "center" as const,
  },
  skeletonAvatar: {
    alignSelf: "center" as const,
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  skeletonLine: {
    alignSelf: "center" as const,
    width: "50%" as const,
    height: 28,
  },
});

const ProfileScreen = () => {
  const router = useRouter();
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useT();
  const toast = useToast();
  const dialog = useDialog();

  const { data: profile, isLoading, isError, refetch } = useMyProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const removeAvatar = useRemoveAvatar();
  const { data: splits } = useSplits();
  const setSplitPrivacy = useSetSplitPrivacy();

  const privacyOptions: { value: ProfilePrivacy; label: string }[] = [
    { value: "public", label: t("profile.privacy.public") },
    { value: "gymbros", label: t("profile.privacy.gymbros") },
    { value: "private", label: t("profile.privacy.private") },
  ];

  const privacyHelp: Record<ProfilePrivacy, string> = {
    public: t("profile.privacy.publicHelp"),
    gymbros: t("profile.privacy.gymbrosHelp"),
    private: t("profile.privacy.privateHelp"),
  };

  const showPhotoError = () =>
    toast.show(t("profile.photoError"), { tone: "error" });

  const pickPhoto = async () => {
    try {
      // Loaded on demand: a build made before the picker was added would
      // otherwise fail to open this whole screen.
      const ImagePicker = await import("expo-image-picker");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      uploadAvatar.mutate(
        { uri: asset.uri, mimeType: asset.mimeType },
        {
          onSuccess: () => toast.show(t("profile.photoUpdated")),
          onError: showPhotoError,
        }
      );
    } catch {
      toast.show(t("profile.photoUnavailable"), { tone: "error" });
    }
  };

  const openPhotoMenu = () =>
    dialog.show({
      title: t("profile.photoMenuTitle"),
      actions: [
        { label: t("profile.photoChoose"), variant: "primary", onPress: pickPhoto },
        ...(profile?.avatar_url
          ? [
              {
                label: t("profile.photoRemove"),
                variant: "destructive" as const,
                onPress: () =>
                  removeAvatar.mutate(undefined, {
                    onSuccess: () => toast.show(t("profile.photoRemoved")),
                    onError: showPhotoError,
                  }),
              },
            ]
          : []),
        { label: t("common.cancel"), variant: "cancel" },
      ],
    });

  const changePrivacy = (value: ProfilePrivacy) =>
    updateProfile.mutate(
      { profile_privacy: value },
      {
        onError: () =>
          toast.show(t("profile.privacySaveError"), { tone: "error" }),
      }
    );

  const changeSplitPrivacy = (id: string, privacy: SplitPrivacy) =>
    setSplitPrivacy.mutate(
      { id, privacy },
      {
        onError: () =>
          toast.show(t("profile.sharing.error"), { tone: "error" }),
      }
    );

  const openSettings = () => router.push("/settings");
  const editProfile = () => router.push("/edit-profile");

  const renderBody = () => {
    if (isLoading) {
      return (
        <View style={styles.content}>
          <Skeleton variant="pill" style={styles.skeletonAvatar} />
          <Skeleton style={styles.skeletonLine} />
        </View>
      );
    }

    if (isError || !profile) {
      return (
        <EmptyState
          alert
          icon="alert-circle-outline"
          title={t("profile.loadError")}
          actionLabel={t("common.retry")}
          onAction={() => refetch()}
        />
      );
    }

    const name = displayName(profile);
    const busyWithPhoto = uploadAvatar.isPending || removeAvatar.isPending;

    return (
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.identity}>
          <Pressable
            onPress={openPhotoMenu}
            disabled={busyWithPhoto}
            accessibilityRole="button"
            accessibilityLabel={t("profile.changePhoto")}
            accessibilityState={{ busy: busyWithPhoto }}
            style={({ pressed }) => [
              styles.avatarButton,
              (pressed || busyWithPhoto) && { opacity: Opacity.pressed },
            ]}
          >
            <Avatar
              uri={profile.avatar_url}
              name={name ?? t("profile.noName")}
              size={AVATAR_SIZE}
            />
            <View style={styles.cameraBadge}>
              <MaterialCommunityIcons
                name="camera"
                size={IconSize.sm}
                color={theme.onPrimary}
                importantForAccessibility="no"
                accessibilityElementsHidden
              />
            </View>
          </Pressable>

          <View style={styles.names}>
            <ThemedText type="headline" numberOfLines={1} style={styles.centered}>
              {name ?? t("profile.noName")}
            </ThemedText>

            {profile.user_name ? (
              name !== `@${profile.user_name}` && (
                <ThemedText type="label" tone="secondary">
                  @{profile.user_name}
                </ThemedText>
              )
            ) : (
              <Pressable
                onPress={editProfile}
                accessibilityRole="button"
                style={styles.usernamePrompt}
              >
                <ThemedText type="label" tone="accent">
                  {t("profile.chooseUsername")}
                </ThemedText>
              </Pressable>
            )}

            {!!profile.bio && (
              <ThemedText type="body" tone="secondary" style={styles.centered}>
                {profile.bio}
              </ThemedText>
            )}
          </View>
        </View>

        <Button
          label={t("profile.edit")}
          variant="outline"
          leftIcon="pencil-outline"
          onPress={editProfile}
        />

        <Section title={t("profile.privacy.title")}>
          <SegmentedControl
            options={privacyOptions}
            value={profile.profile_privacy}
            onChange={changePrivacy}
            accessibilityLabel={t("profile.privacy.a11y")}
          />
          <ThemedText type="caption" tone="secondary" accessibilityLiveRegion="polite">
            {privacyHelp[profile.profile_privacy]}
          </ThemedText>
        </Section>

        <Section title={t("profile.sharing.title")}>
          <ThemedText type="caption" tone="secondary">
            {profile.profile_privacy === "private"
              ? t("profile.sharing.profilePrivateNote")
              : t("profile.sharing.help")}
          </ThemedText>

          {splits?.map((split) => (
            <SplitSharingRow
              key={split.id}
              split={split}
              onChange={(privacy) => changeSplitPrivacy(split.id, privacy)}
            />
          ))}
        </Section>
      </ScrollView>
    );
  };

  return (
    <ScreenContainer>
      <ScreenHeader
        title={t("profile.title")}
        right={
          <IconButton
            icon="cog-outline"
            onPress={openSettings}
            accessibilityLabel={t("profile.openSettings")}
          />
        }
      />
      {renderBody()}
    </ScreenContainer>
  );
};

export default ProfileScreen;

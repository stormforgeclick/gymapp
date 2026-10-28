import { useNavigation, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import ScreenHeader from "@/components/ui/ScreenHeader";
import TextField from "@/components/ui/TextField";
import { Spacing } from "@/constants/theme";
import { useMyProfile, useUpdateProfile } from "@/hooks/api/profile";
import {
  CHECK_VIOLATION,
  UNIQUE_VIOLATION,
  type Profile,
} from "@/hooks/api/profile/queries";
import { useTheme } from "@/hooks/use-theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useT } from "@/i18n";
import { useDialog } from "@/providers/DialogProvider";
import { useToast } from "@/providers/ToastProvider";

const BIO_MAX_LENGTH = 500;
const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

type Form = {
  firstName: string;
  lastName: string;
  userName: string;
  bio: string;
};

const toForm = (profile: Profile): Form => ({
  firstName: profile.first_name ?? "",
  lastName: profile.last_name ?? "",
  userName: profile.user_name ?? "",
  bio: profile.bio ?? "",
});

/** @usernames are lowercase letters, digits and underscores; anything else is dropped as typed. */
const normalizeUserName = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9_]/g, "");

const makeStyles = () => ({
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  content: {
    gap: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  counter: {
    textAlign: "right" as const,
  },
});

const EditProfileScreen = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useT();
  const toast = useToast();
  const dialog = useDialog();

  const { data: profile, isError, refetch } = useMyProfile();
  const update = useUpdateProfile();

  const [form, setForm] = useState<Form | null>(null);
  const [userNameTouched, setUserNameTouched] = useState(false);
  const [userNameTaken, setUserNameTaken] = useState(false);
  const leaving = useRef(false);

  // The form starts from the saved profile once it is available.
  if (profile && form === null) setForm(toForm(profile));

  const saved = useMemo(() => (profile ? toForm(profile) : null), [profile]);
  const dirty =
    !!form &&
    !!saved &&
    (Object.keys(form) as (keyof Form)[]).some((key) => form[key] !== saved[key]);

  const userNameInvalid =
    !!form && form.userName !== "" && !USERNAME_PATTERN.test(form.userName);

  // Covers the header arrow as well as the system back gesture and button.
  useEffect(
    () =>
      navigation.addListener("beforeRemove", (event) => {
        if (!dirty || leaving.current) return;

        event.preventDefault();
        dialog.show({
          title: t("editProfile.discardTitle"),
          message: t("editProfile.discardMessage"),
          actions: [
            { label: t("editProfile.keepEditing"), variant: "cancel" },
            {
              label: t("editProfile.discard"),
              variant: "destructive",
              onPress: () => {
                leaving.current = true;
                navigation.dispatch(event.data.action);
              },
            },
          ],
        });
      }),
    [navigation, dirty, dialog, t]
  );

  const change = (patch: Partial<Form>) =>
    setForm((current) => current && { ...current, ...patch });

  const save = () => {
    if (!form) return;
    if (userNameInvalid) {
      setUserNameTouched(true);
      return;
    }

    update.mutate(
      {
        first_name: form.firstName.trim() || null,
        last_name: form.lastName.trim() || null,
        user_name: form.userName || null,
        bio: form.bio.trim() || null,
      },
      {
        onSuccess: () => {
          leaving.current = true;
          toast.show(t("editProfile.saved"));
          router.back();
        },
        onError: (error) => {
          const code = (error as { code?: string }).code;
          if (code === UNIQUE_VIOLATION) setUserNameTaken(true);
          else if (code === CHECK_VIOLATION) setUserNameTouched(true);
          else toast.show(t("editProfile.saveError"), { tone: "error" });
        },
      }
    );
  };

  const userNameError = userNameTaken
    ? t("editProfile.userNameTaken")
    : userNameInvalid && userNameTouched
      ? t("editProfile.userNameInvalid")
      : null;

  const renderBody = () => {
    if (isError && !profile) {
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

    if (!form) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.accentText} />
        </View>
      );
    }

    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TextField
            label={t("editProfile.firstName")}
            value={form.firstName}
            onChangeText={(firstName) => change({ firstName })}
            autoCapitalize="words"
            autoComplete="given-name"
            textContentType="givenName"
            maxLength={40}
          />

          <TextField
            label={t("editProfile.lastName")}
            value={form.lastName}
            onChangeText={(lastName) => change({ lastName })}
            autoCapitalize="words"
            autoComplete="family-name"
            textContentType="familyName"
            maxLength={40}
          />

          <View style={{ gap: Spacing.two }}>
            <TextField
              label={t("editProfile.userName")}
              icon="at"
              value={form.userName}
              onChangeText={(text) => {
                setUserNameTaken(false);
                change({ userName: normalizeUserName(text) });
              }}
              onBlur={() => setUserNameTouched(true)}
              error={userNameError}
              placeholder={t("editProfile.userNamePlaceholder")}
              autoCorrect={false}
              maxLength={20}
            />
            <ThemedText type="caption" tone="secondary">
              {t("editProfile.userNameHint")}
            </ThemedText>
          </View>

          <View style={{ gap: Spacing.two }}>
            <TextField
              label={t("editProfile.bio")}
              value={form.bio}
              onChangeText={(bio) => change({ bio })}
              placeholder={t("editProfile.bioPlaceholder")}
              autoCapitalize="sentences"
              multiline
              maxLength={BIO_MAX_LENGTH}
            />
            <ThemedText
              type="caption"
              tone="secondary"
              tabular
              style={styles.counter}
            >
              {form.bio.length}/{BIO_MAX_LENGTH}
            </ThemedText>
          </View>
        </ScrollView>

        <Button
          label={t("editProfile.save")}
          onPress={save}
          loading={update.isPending}
          disabled={!dirty || userNameInvalid}
        />
      </KeyboardAvoidingView>
    );
  };

  return (
    <ScreenContainer edges={["top", "bottom"]}>
      <ScreenHeader
        title={t("editProfile.title")}
        size="headline"
        onBack={() => router.back()}
      />
      {renderBody()}
    </ScreenContainer>
  );
};

export default EditProfileScreen;

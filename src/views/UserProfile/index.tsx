import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Fragment } from "react";
import { ScrollView, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import ScreenHeader from "@/components/ui/ScreenHeader";
import Section from "@/components/ui/Section";
import Skeleton from "@/components/ui/Skeleton";
import { IconSize, Radius, Spacing, type ThemeColors } from "@/constants/theme";
import {
  useCancelRequest,
  useGymbroProfile,
  useProfileRoutines,
  useRemoveGymbro,
  useRespondToRequest,
  useSendGymbroRequest,
} from "@/hooks/api/gymbros";
import { useTheme } from "@/hooks/use-theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useT } from "@/i18n";
import { displayName } from "@/lib/profile";
import { useDialog } from "@/providers/DialogProvider";
import { useToast } from "@/providers/ToastProvider";
import RoutineComponent from "@/views/Routines/Components/Routine";
import RoutineSkeleton from "@/views/Routines/Components/RoutineSkeleton";

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
  names: {
    alignItems: "center" as const,
    gap: Spacing.half,
  },
  centered: {
    textAlign: "center" as const,
  },
  actions: {
    gap: Spacing.two,
  },
  routines: {
    gap: Spacing.tight,
  },
  answerRow: {
    flexDirection: "row" as const,
    gap: Spacing.two,
  },
  answerButton: {
    flex: 1,
  },
  status: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: Spacing.one,
    minHeight: 48,
  },
  notice: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.tight,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  noticeText: {
    flex: 1,
    gap: Spacing.half,
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

const UserProfileScreen = () => {
  const { id: userId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t, language } = useT();
  const toast = useToast();
  const dialog = useDialog();

  const { data: profile, isLoading, isError, refetch } = useGymbroProfile(userId);
  const canSeeRoutines = !!profile?.can_view_full && !profile.is_self;
  const routines = useProfileRoutines(userId, language, canSeeRoutines);
  const severalSplits =
    new Set(routines.data?.map((routine) => routine.split_id)).size > 1;
  const send = useSendGymbroRequest();
  const respond = useRespondToRequest();
  const cancel = useCancelRequest();
  const remove = useRemoveGymbro();

  const busy =
    send.isPending || respond.isPending || cancel.isPending || remove.isPending;

  const showError = (error: unknown) => {
    const message = String((error as { message?: string })?.message ?? "");
    toast.show(
      t(message.includes("unavailable") ? "gymbros.errorUnavailable" : "gymbros.errorGeneric"),
      { tone: "error" }
    );
  };

  const renderBody = () => {
    if (isLoading) {
      return (
        <View style={styles.content}>
          <Skeleton variant="pill" style={styles.skeletonAvatar} />
          <Skeleton style={styles.skeletonLine} />
        </View>
      );
    }

    if (isError) {
      return (
        <EmptyState
          alert
          icon="alert-circle-outline"
          title={t("gymbros.profileLoadError")}
          actionLabel={t("common.retry")}
          onAction={() => refetch()}
        />
      );
    }

    if (!profile) {
      return (
        <EmptyState icon="account-off-outline" title={t("gymbros.profileUnavailable")} />
      );
    }

    const name = displayName(profile) ?? t("profile.noName");

    const add = () =>
      send.mutate(profile.id, {
        onSuccess: (status) =>
          toast.show(
            t(status === "accepted" ? "gymbros.nowGymbros" : "gymbros.requestSent")
          ),
        onError: showError,
      });

    const answer = (status: "accepted" | "rejected") =>
      respond.mutate(
        { friendshipId: profile.friendship_id!, status },
        {
          onSuccess: () =>
            toast.show(
              t(status === "accepted" ? "gymbros.requestAccepted" : "gymbros.requestRejected")
            ),
          onError: showError,
        }
      );

    const withdraw = () =>
      cancel.mutate(profile.friendship_id!, {
        onSuccess: () => toast.show(t("gymbros.requestCancelled")),
        onError: showError,
      });

    const confirmRemove = () =>
      dialog.show({
        title: t("gymbros.removeConfirmTitle"),
        message: t("gymbros.removeConfirmMessage", { name }),
        actions: [
          { label: t("common.cancel"), variant: "cancel" },
          {
            label: t("gymbros.remove"),
            variant: "destructive",
            onPress: () =>
              remove.mutate(profile.id, {
                onSuccess: () => toast.show(t("gymbros.removed")),
                onError: showError,
              }),
          },
        ],
      });

    const renderActions = () => {
      if (profile.is_self) {
        return (
          <Button
            label={t("profile.edit")}
            variant="outline"
            leftIcon="pencil-outline"
            onPress={() => router.push("/edit-profile")}
          />
        );
      }

      switch (profile.relation) {
        case "none":
          return (
            <Button
              label={t("gymbros.addToGymbros")}
              leftIcon="account-plus-outline"
              onPress={add}
              loading={send.isPending}
              disabled={busy}
            />
          );

        case "pending_sent":
          return (
            <Button
              label={t("gymbros.cancelRequest")}
              variant="outline"
              onPress={withdraw}
              loading={cancel.isPending}
              disabled={busy}
              accessibilityHint={t("gymbros.requestSentHint")}
            />
          );

        case "pending_received":
          return (
            <View style={styles.answerRow}>
              <Button
                label={t("gymbros.reject")}
                variant="outline"
                onPress={() => answer("rejected")}
                disabled={busy}
                style={styles.answerButton}
              />
              <Button
                label={t("gymbros.accept")}
                onPress={() => answer("accepted")}
                loading={respond.isPending}
                disabled={busy}
                style={styles.answerButton}
              />
            </View>
          );

        case "accepted":
          return (
            <>
              <View
                style={styles.status}
                accessible
                accessibilityLabel={t("gymbros.isGymbro")}
              >
                <MaterialCommunityIcons
                  name="check-circle"
                  size={IconSize.md}
                  color={theme.accentText}
                />
                <ThemedText type="bodyStrong" tone="accent">
                  {t("gymbros.isGymbro")}
                </ThemedText>
              </View>
              <Button
                label={t("gymbros.remove")}
                variant="danger"
                onPress={confirmRemove}
                loading={remove.isPending}
                disabled={busy}
              />
            </>
          );

        case "unavailable":
          return (
            <ThemedText type="label" tone="tertiary" style={styles.centered}>
              {t("gymbros.unavailable")}
            </ThemedText>
          );
      }
    };

    return (
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.identity}>
          <Avatar uri={profile.avatar_url} name={name} size={AVATAR_SIZE} />

          <View style={styles.names}>
            <ThemedText type="headline" numberOfLines={1} style={styles.centered}>
              {name}
            </ThemedText>
            {!!profile.user_name && name !== `@${profile.user_name}` && (
              <ThemedText type="label" tone="secondary">
                @{profile.user_name}
              </ThemedText>
            )}
            {!!profile.bio && (
              <ThemedText type="body" tone="secondary" style={styles.centered}>
                {profile.bio}
              </ThemedText>
            )}
          </View>
        </View>

        <View style={styles.actions}>{renderActions()}</View>

        {canSeeRoutines && (
          <Section title={t("gymbros.sharedRoutines")}>
            {routines.isLoading ? (
              <RoutineSkeleton />
            ) : routines.isError ? (
              <ThemedText type="label" tone="secondary">
                {t("gymbros.routinesError")}
              </ThemedText>
            ) : routines.data && routines.data.length > 0 ? (
              <View style={styles.routines}>
                {routines.data.map((routine, index) => (
                  <Fragment key={routine.id}>
                    {/* Routines come ordered by split, so a header marks each new one. */}
                    {severalSplits &&
                      routine.split_id !== routines.data[index - 1]?.split_id && (
                        <ThemedText
                          type="overline"
                          tone="tertiary"
                          accessibilityRole="header"
                        >
                          {routine.split_name}
                        </ThemedText>
                      )}
                    <RoutineComponent
                      {...routine}
                      action={() =>
                        router.push({
                          pathname: "/shared-routine/[id]",
                          params: { id: routine.id },
                        })
                      }
                    />
                  </Fragment>
                ))}
              </View>
            ) : (
              <ThemedText type="label" tone="secondary">
                {t("gymbros.noSharedRoutines")}
              </ThemedText>
            )}
          </Section>
        )}

        {!profile.can_view_full && !profile.is_self && (
          <View style={styles.notice}>
            <MaterialCommunityIcons
              name="lock-outline"
              size={IconSize.lg}
              color={theme.textSecondary}
              importantForAccessibility="no"
              accessibilityElementsHidden
            />
            <View style={styles.noticeText}>
              <ThemedText type="bodyStrong">{t("gymbros.limitedProfile")}</ThemedText>
              <ThemedText type="caption" tone="secondary">
                {t("gymbros.limitedProfileHint")}
              </ThemedText>
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <ScreenContainer edges={["top", "bottom"]}>
      <ScreenHeader
        title={t("gymbros.profileTitle")}
        size="headline"
        onBack={() => router.back()}
      />
      {renderBody()}
    </ScreenContainer>
  );
};

export default UserProfileScreen;

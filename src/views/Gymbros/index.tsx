import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import IconButton from "@/components/ui/IconButton";
import PersonRow from "@/components/ui/PersonRow";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import ScreenHeader from "@/components/ui/ScreenHeader";
import SearchInput from "@/components/ui/SearchInput";
import Skeleton from "@/components/ui/Skeleton";
import { Radius, Spacing, type ThemeColors } from "@/constants/theme";
import {
  useCancelRequest,
  useGymbroRequests,
  useGymbros,
  useRespondToRequest,
  useSearchProfiles,
  useSendGymbroRequest,
} from "@/hooks/api/gymbros";
import type { GymbroRequest, Person } from "@/hooks/api/gymbros/queries";
import { useMyProfile } from "@/hooks/api/profile";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useT } from "@/i18n";
import { displayName } from "@/lib/profile";
import { useToast } from "@/providers/ToastProvider";
import RelationButton from "./components/RelationButton";

const MIN_SEARCH_LENGTH = 2;

const makeStyles = (c: ThemeColors) => ({
  searchBox: {
    marginBottom: Spacing.three,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: Spacing.two,
    paddingBottom: Spacing.three,
  },
  header: {
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  block: {
    gap: Spacing.two,
  },
  actions: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
  },
  usernamePrompt: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.tight,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  usernamePromptText: {
    flex: 1,
  },
  skeletonRow: {
    height: 72,
    borderRadius: Radius.md,
  },
});

const nameOf = (person: Person, fallback: string) =>
  displayName(person) ?? fallback;

const GymbrosScreen = () => {
  const router = useRouter();
  const styles = useThemedStyles(makeStyles);
  const { t } = useT();
  const toast = useToast();

  const [search, setSearch] = useState("");
  const query = search.trim();
  const searching = query.length > 0;

  const { data: myProfile } = useMyProfile();
  const results = useSearchProfiles(query);
  const gymbros = useGymbros();
  const requests = useGymbroRequests();
  const send = useSendGymbroRequest();
  const respond = useRespondToRequest();
  const cancel = useCancelRequest();

  const { refetch: refetchGymbros } = gymbros;
  const { refetch: refetchRequests } = requests;

  // Someone may have answered while the user was on another tab.
  useFocusEffect(
    useCallback(() => {
      refetchGymbros({ cancelRefetch: false });
      refetchRequests({ cancelRefetch: false });
    }, [refetchGymbros, refetchRequests])
  );

  const incoming = requests.data?.filter((r) => r.direction === "incoming") ?? [];
  const outgoing = requests.data?.filter((r) => r.direction === "outgoing") ?? [];

  const openProfile = (userId: string) =>
    router.push({ pathname: "/user/[id]", params: { id: userId } });

  const showError = (error: unknown) => {
    const message = String((error as { message?: string })?.message ?? "");
    toast.show(
      t(message.includes("unavailable") ? "gymbros.errorUnavailable" : "gymbros.errorGeneric"),
      { tone: "error" }
    );
  };

  const add = (userId: string) =>
    send.mutate(userId, {
      onSuccess: (status) =>
        toast.show(
          t(status === "accepted" ? "gymbros.nowGymbros" : "gymbros.requestSent")
        ),
      onError: showError,
    });

  const answer = (friendshipId: string, status: "accepted" | "rejected") =>
    respond.mutate(
      { friendshipId, status },
      {
        onSuccess: () =>
          toast.show(
            t(status === "accepted" ? "gymbros.requestAccepted" : "gymbros.requestRejected")
          ),
        onError: showError,
      }
    );

  const withdraw = (friendshipId: string) =>
    cancel.mutate(friendshipId, {
      onSuccess: () => toast.show(t("gymbros.requestCancelled")),
      onError: showError,
    });

  const skeletons = (
    <View style={styles.block}>
      <Skeleton variant="card" style={styles.skeletonRow} />
      <Skeleton variant="card" style={styles.skeletonRow} />
      <Skeleton variant="card" style={styles.skeletonRow} />
    </View>
  );

  const renderSearch = () => {
    if (query.length < MIN_SEARCH_LENGTH) {
      return (
        <EmptyState icon="magnify" title={t("gymbros.minChars")} />
      );
    }

    if (results.isError && !results.data) {
      return (
        <EmptyState
          alert
          icon="alert-circle-outline"
          title={t("gymbros.searchError")}
          actionLabel={t("common.retry")}
          onAction={() => results.refetch()}
        />
      );
    }

    if (!results.data) return skeletons;

    return (
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        data={results.data}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <EmptyState
            icon="account-search-outline"
            title={t("gymbros.noResults")}
            description={t("gymbros.noResultsHint")}
          />
        }
        renderItem={({ item }) => {
          const name = nameOf(item, t("profile.noName"));
          const incomingRequest = incoming.find((r) => r.id === item.id);

          return (
            <PersonRow
              person={item}
              onPress={() => openProfile(item.id)}
              trailing={
                <RelationButton
                  relation={item.relation}
                  name={name}
                  loading={send.isPending && send.variables === item.id}
                  onAdd={() => add(item.id)}
                  onAccept={() =>
                    incomingRequest
                      ? answer(incomingRequest.friendship_id, "accepted")
                      : openProfile(item.id)
                  }
                />
              }
            />
          );
        }}
      />
    );
  };

  const renderRequest = (request: GymbroRequest) => {
    const name = nameOf(request, t("profile.noName"));

    return (
      <PersonRow
        key={request.friendship_id}
        person={request}
        onPress={() => openProfile(request.id)}
        trailing={
          request.direction === "incoming" ? (
            <View style={styles.actions}>
              <IconButton
                icon="close"
                onPress={() => answer(request.friendship_id, "rejected")}
                accessibilityLabel={t("gymbros.rejectA11y", { name })}
              />
              <IconButton
                icon="check"
                variant="filled"
                onPress={() => answer(request.friendship_id, "accepted")}
                accessibilityLabel={t("gymbros.acceptA11y", { name })}
              />
            </View>
          ) : (
            <Button
              label={t("common.cancel")}
              variant="ghost"
              size="sm"
              fullWidth={false}
              onPress={() => withdraw(request.friendship_id)}
              accessibilityLabel={t("gymbros.cancelA11y", { name })}
            />
          )
        }
      />
    );
  };

  const renderHome = () => {
    if (gymbros.isLoading) return skeletons;

    if (gymbros.isError && !gymbros.data) {
      return (
        <EmptyState
          alert
          icon="alert-circle-outline"
          title={t("gymbros.loadError")}
          actionLabel={t("common.retry")}
          onAction={() => gymbros.refetch()}
        />
      );
    }

    const friends = gymbros.data ?? [];

    return (
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        data={friends}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.header}>
            {myProfile && !myProfile.user_name && (
              <View style={styles.usernamePrompt}>
                <ThemedText
                  type="label"
                  tone="secondary"
                  style={styles.usernamePromptText}
                >
                  {t("gymbros.usernamePrompt")}
                </ThemedText>
                <Button
                  label={t("gymbros.usernameAction")}
                  size="sm"
                  fullWidth={false}
                  onPress={() => router.push("/edit-profile")}
                />
              </View>
            )}

            {incoming.length > 0 && (
              <View style={styles.block}>
                <ThemedText type="overline" tone="secondary" accessibilityRole="header">
                  {t("gymbros.requests", { count: incoming.length })}
                </ThemedText>
                {incoming.map(renderRequest)}
              </View>
            )}

            {outgoing.length > 0 && (
              <View style={styles.block}>
                <ThemedText type="overline" tone="secondary" accessibilityRole="header">
                  {t("gymbros.sent")}
                </ThemedText>
                {outgoing.map(renderRequest)}
              </View>
            )}

            {friends.length > 0 && (
              <ThemedText type="overline" tone="secondary" accessibilityRole="header">
                {t("gymbros.mine", { count: friends.length })}
              </ThemedText>
            )}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="account-group"
            title={t("gymbros.empty")}
            description={t("gymbros.emptyHint")}
          />
        }
        renderItem={({ item }) => (
          <PersonRow person={item} onPress={() => openProfile(item.id)} />
        )}
      />
    );
  };

  return (
    <ScreenContainer>
      <ScreenHeader title={t("gymbros.title")} />

      <View style={styles.searchBox}>
        <SearchInput
          onChangeText={setSearch}
          placeholder={t("gymbros.searchPlaceholder")}
        />
      </View>

      {searching ? renderSearch() : renderHome()}
    </ScreenContainer>
  );
};

export default GymbrosScreen;

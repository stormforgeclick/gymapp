import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/providers/AuthProvider";
import {
  getMyProfile,
  removeAvatarFile,
  updateMyProfile,
  uploadAvatar,
  type Profile,
  type ProfilePatch,
} from "./queries";

export const myProfileKey = (userId: string | undefined) =>
  ["profile", userId] as const;

export const useMyProfile = () => {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: myProfileKey(userId),
    queryFn: () => getMyProfile(userId!),
    enabled: !!userId,
  });
};

/**
 * Edits show up right away and are rolled back if saving fails, so toggles
 * like the privacy level feel instant.
 */
export const useUpdateProfile = () => {
  const qc = useQueryClient();
  const { session } = useAuth();
  const userId = session?.user.id;
  const key = myProfileKey(userId);

  return useMutation({
    mutationFn: (patch: ProfilePatch) => updateMyProfile(userId!, patch),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Profile>(key);
      qc.setQueryData<Profile>(key, (data) => data && { ...data, ...patch });
      return { previous };
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous);
    },
    onSuccess: (profile) => qc.setQueryData(key, profile),
  });
};

export const useUploadAvatar = () => {
  const qc = useQueryClient();
  const { session } = useAuth();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async (photo: { uri: string; mimeType?: string | null }) => {
      const url = await uploadAvatar(userId!, photo.uri, photo.mimeType);
      return updateMyProfile(userId!, { avatar_url: url });
    },
    onSuccess: (profile) => qc.setQueryData(myProfileKey(userId), profile),
  });
};

export const useRemoveAvatar = () => {
  const qc = useQueryClient();
  const { session } = useAuth();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async () => {
      await removeAvatarFile(userId!);
      return updateMyProfile(userId!, { avatar_url: null });
    },
    onSuccess: (profile) => qc.setQueryData(myProfileKey(userId), profile),
  });
};

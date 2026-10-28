import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useAuth } from "@/providers/AuthProvider";
import {
  cancelRequest,
  countPendingRequests,
  getGymbroRequests,
  getGymbros,
  getProfile,
  getProfileRoutines,
  getSharedRoutine,
  getSharedRoutineExercises,
  importRoutine,
  removeGymbro,
  respondToRequest,
  searchProfiles,
  sendGymbroRequest,
} from "./queries";

const GYMBROS_KEY = ["gymbros"] as const;

const MIN_SEARCH_LENGTH = 2;

export const useSearchProfiles = (query: string) =>
  useQuery({
    queryKey: [...GYMBROS_KEY, "search", query],
    queryFn: () => searchProfiles(query),
    enabled: query.length >= MIN_SEARCH_LENGTH,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

export const useGymbros = () =>
  useQuery({
    queryKey: [...GYMBROS_KEY, "list"],
    queryFn: getGymbros,
  });

export const useGymbroRequests = () =>
  useQuery({
    queryKey: [...GYMBROS_KEY, "requests"],
    queryFn: getGymbroRequests,
  });

export const useGymbroProfile = (userId: string) =>
  useQuery({
    queryKey: [...GYMBROS_KEY, "profile", userId],
    queryFn: () => getProfile(userId),
    enabled: !!userId,
  });

type Language = "en" | "es";

/** `enabled` is off while the viewer can't see the profile's routines anyway. */
export const useProfileRoutines = (
  userId: string,
  language: Language,
  enabled: boolean
) =>
  useQuery({
    queryKey: [...GYMBROS_KEY, "routines", userId, language],
    queryFn: () => getProfileRoutines(userId, language),
    enabled: enabled && !!userId,
  });

export const useSharedRoutine = (routineId: string) =>
  useQuery({
    queryKey: [...GYMBROS_KEY, "shared-routine", routineId],
    queryFn: () => getSharedRoutine(routineId),
    enabled: !!routineId,
  });

export const useSharedRoutineExercises = (
  routineId: string,
  language: Language
) =>
  useQuery({
    queryKey: [...GYMBROS_KEY, "shared-routine-exercises", routineId, language],
    queryFn: () => getSharedRoutineExercises(routineId, language),
    enabled: !!routineId,
  });

/** Saving a shared routine adds a routine to the user's own list. */
export const useImportRoutine = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (routineId: string) => importRoutine(routineId),
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ["routines"] }),
        qc.invalidateQueries({ queryKey: ["routineSharing"] }),
      ]),
  });
};

/** Requests waiting for the user's answer, for the Gymbros tab badge. */
export const usePendingRequestCount = () => {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: [...GYMBROS_KEY, "pending-count", userId],
    queryFn: () => countPendingRequests(userId!),
    enabled: !!userId,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
};

/** Every change here can alter lists, profiles and the badge, so refresh them all. */
const useInvalidateGymbros = () => {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: GYMBROS_KEY });
};

export const useSendGymbroRequest = () => {
  const invalidate = useInvalidateGymbros();
  return useMutation({
    mutationFn: (userId: string) => sendGymbroRequest(userId),
    onSuccess: invalidate,
  });
};

export const useRespondToRequest = () => {
  const invalidate = useInvalidateGymbros();
  return useMutation({
    mutationFn: (input: {
      friendshipId: string;
      status: "accepted" | "rejected";
    }) => respondToRequest(input.friendshipId, input.status),
    onSuccess: invalidate,
  });
};

export const useCancelRequest = () => {
  const invalidate = useInvalidateGymbros();
  return useMutation({
    mutationFn: (friendshipId: string) => cancelRequest(friendshipId),
    onSuccess: invalidate,
  });
};

export const useRemoveGymbro = () => {
  const invalidate = useInvalidateGymbros();
  return useMutation({
    mutationFn: (userId: string) => removeGymbro(userId),
    onSuccess: invalidate,
  });
};

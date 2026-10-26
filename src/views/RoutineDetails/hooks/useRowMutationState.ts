import { useState } from "react";

export function useRowMutationState<K extends string = string>() {
  const [activeId, setActiveId] = useState<K | null>(null);
  const [errors, setErrors] = useState<Partial<Record<K, string>>>({});

  const begin = (id: K) => setActiveId(id);

  const succeed = (id: K) => {
    setActiveId((prev) => (prev === id ? null : prev));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const fail = (id: K, msg: string) => {
    setActiveId((prev) => (prev === id ? null : prev));
    setErrors((prev) => ({ ...prev, [id]: msg }));
  };

  const clearError = (id: K) =>
    setErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

  const isActive = (id: K) => activeId === id;
  const errorFor = (id: K): string | null => errors[id] ?? null;

  return { begin, succeed, fail, clearError, isActive, errorFor };
}

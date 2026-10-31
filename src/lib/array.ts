/** A copy of `list` with the item at `from` moved to index `to`. */
export const moveItem = <T>(list: T[], from: number, to: number): T[] => {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

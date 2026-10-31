const UNSIGNED_DECIMAL = /^(\d+\.?\d*|\.\d+)$/;

/**
 * Reads a number typed into a field: `null` for an empty field, `undefined`
 * when the text isn't a valid value. A decimal comma counts as a dot, and
 * negatives, exponents and hex are not valid.
 */
export function parseNumber(
  text: string,
  { integer = false }: { integer?: boolean } = {}
): number | null | undefined {
  const normalized = text.trim().replace(",", ".");
  if (normalized === "") return null;
  if (!UNSIGNED_DECIMAL.test(normalized)) return undefined;

  const value = Number(normalized);
  if (integer && !Number.isInteger(value)) return undefined;
  return value;
}

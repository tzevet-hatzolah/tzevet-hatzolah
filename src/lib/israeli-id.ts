/**
 * Israeli ID number ("תעודת זהות") checksum validation.
 *
 * Real IDs are 5–9 digits; shorter ones are left-padded with zeros to 9.
 * Each digit is multiplied alternately by 1 and 2 (starting from position 0);
 * if the product is two digits, its digits are summed (or equivalently, subtract 9).
 * The total must be divisible by 10.
 */

// Marker used when a donor opts out of providing a real Israeli ID. Sumit's
// citizenid field needs *something*; "999999999" is the standard placeholder
// across Israeli payment integrations. Treated as opt-out everywhere — no
// סעיף 46 receipt, never validated as a real ID.
export const ID_OPT_OUT_MARKER = "999999999";

export function isValidIsraeliId(input: string): boolean {
  if (typeof input !== "string") return false;
  const digits = input.replace(/\D/g, "");
  if (digits.length < 5 || digits.length > 9) return false;
  // Reject "00000…" — passes checksum but is not a real ID.
  if (/^0+$/.test(digits)) return false;

  const padded = digits.padStart(9, "0");
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let n = parseInt(padded[i], 10);
    if (i % 2 === 1) {
      n *= 2;
      if (n >= 10) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

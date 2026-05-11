export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isFullName(raw: string): boolean {
  return raw.trim().split(/\s+/).filter(Boolean).length >= 2;
}

export function isValidPhone(raw: string): boolean {
  const trimmed = raw.trim();
  if (!/^[\d+\s\-()]+$/.test(trimmed)) return false;
  if (!/^[+\d(]/.test(trimmed)) return false;
  if (!/[\d)]$/.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 15;
}

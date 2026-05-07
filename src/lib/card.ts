export type CardBrand =
  | "visa"
  | "mastercard"
  | "amex"
  | "discover"
  | "diners"
  | "jcb";

const BRAND_LABELS: Record<CardBrand, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  discover: "Discover",
  diners: "Diners Club",
  jcb: "JCB",
};

export function detectCardBrand(raw: string): CardBrand | null {
  const n = raw.replace(/\D/g, "");
  if (!n) return null;
  if (/^4/.test(n)) return "visa";
  if (/^3[47]/.test(n)) return "amex";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "mastercard";
  if (/^(6011|65|64[4-9])/.test(n)) return "discover";
  if (/^(36|38|30[0-5])/.test(n)) return "diners";
  if (/^35/.test(n)) return "jcb";
  return null;
}

export function brandLabel(brand: CardBrand | null): string | null {
  return brand ? BRAND_LABELS[brand] : null;
}

export function isValidCardNumber(raw: string): boolean {
  const n = raw.replace(/\D/g, "");
  if (n.length < 12 || n.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let d = n.charCodeAt(i) - 48;
    if (d < 0 || d > 9) return false;
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

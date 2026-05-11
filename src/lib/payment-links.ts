export const PAYPAL_HOSTED_BUTTON_ID = "BDNZW74CLNF2E";

export function paypalDonateUrl(amount: number): string {
  const qs = new URLSearchParams({
    hosted_button_id: PAYPAL_HOSTED_BUTTON_ID,
    amount: String(amount),
    currency_code: "ILS",
    "locale.x": "he_IL",
  });
  return `https://www.paypal.com/donate/?${qs.toString()}`;
}

export const JGIVE_URL = "#";
export const BANK_TRANSFER_URL = "#";

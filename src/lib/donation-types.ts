export type DonationIconKey =
  | "heart"
  | "kit"
  | "aed"
  | "ambulance"
  | "cross"
  | "shield"
  | "phone"
  | "volunteer";

export type DonationItem = {
  _id: string;
  name: string;
  nameEn?: string;
  description: string;
  descriptionEn?: string;
  impactText?: string;
  impactTextEn?: string;
  slug: string;
  cardType: "amount" | "custom";
  totalAmount?: number;
  defaultPayments?: number;
  image?: { asset: { _ref: string }; alt?: string } | null;
  icon?: DonationIconKey;
  highlight?: boolean;
};

export const DONATION_PAYMENT_OPTIONS = [1, 6, 12, 18, 24, 36] as const;

export const DONATION_MIN_MONTHLY = 18;
export const DONATION_MAX_PAYMENTS = 36;

export function maxPaymentsFor(total: number): number {
  const minMonthlyCap = Math.max(1, Math.floor(total / DONATION_MIN_MONTHLY));
  return Math.min(DONATION_MAX_PAYMENTS, minMonthlyCap);
}

export function monthlyFor(total: number, payments: number): number {
  if (payments <= 0) return total;
  return Math.round(total / payments);
}

export const FALLBACK_DONATION_ITEMS: DonationItem[] = [
  {
    _id: "fallback-custom",
    name: "תרומה בסכום חופשי",
    nameEn: "Give any amount",
    description:
      "תרמו בכל סכום שתבחרו — חודשי או חד-פעמי. כל שקל מסייע לנו להגיע לעוד אדם בזמן.",
    descriptionEn:
      "Donate any amount — monthly or one-time. Every shekel helps us reach one more person in time.",
    slug: "custom",
    cardType: "custom",
    icon: "heart",
  },
  {
    _id: "fallback-kit",
    name: "ערכת עזרה ראשונה למתנדב",
    nameEn: "Volunteer first-aid kit",
    description:
      "ערכה אישית למתנדב חדש: חבישות, מסכת הנשמה, כפפות וציוד בסיס לטיפול ראשוני בזירת אירוע.",
    descriptionEn:
      "A personal kit for a new volunteer: bandages, breathing mask, gloves, and core gear for first-response treatment at the scene.",
    impactText: "מצוידת מתנדב לעשרות אירועי חירום בשנה",
    impactTextEn: "Equips a volunteer for dozens of emergency calls a year",
    slug: "kit",
    cardType: "amount",
    totalAmount: 1440,
    defaultPayments: 12,
    icon: "kit",
  },
  {
    _id: "fallback-aed",
    name: "דפיברילטור נייד (AED)",
    nameEn: "Portable defibrillator (AED)",
    description:
      "מכשיר החייאה אוטומטי שמאפשר למתנדב לתת מענה מציל-חיים בדקות הקריטיות שלפני הגעת אמבולנס.",
    descriptionEn:
      "An automated CPR device that lets a volunteer deliver life-saving care in the critical minutes before an ambulance arrives.",
    impactText: "ההבדל בין חיים למוות בדום לב פתאומי",
    impactTextEn: "The difference between life and death in sudden cardiac arrest",
    slug: "aed",
    cardType: "amount",
    totalAmount: 8100,
    defaultPayments: 18,
    icon: "aed",
    highlight: true,
  },
  {
    _id: "fallback-training",
    name: "הכשרת מתנדב חדש",
    nameEn: "New volunteer training",
    description:
      "מימון קורס הכשרה למתנדב חדש בשטח: עזרה ראשונה, נהלי חירום, התמודדות עם טראומה ואירועי רב-נפגעים.",
    descriptionEn:
      "Funds a full training course for a new field volunteer: first aid, emergency procedures, trauma response and mass-casualty preparation.",
    impactText: "מתנדב פעיל = מאות אנשים שמקבלים סיוע בשנה",
    impactTextEn: "An active volunteer = hundreds of people helped each year",
    slug: "training",
    cardType: "amount",
    totalAmount: 960,
    defaultPayments: 12,
    icon: "volunteer",
  },
  {
    _id: "fallback-dispatch",
    name: "תמיכה במוקד החירום 24/7",
    nameEn: "24/7 emergency dispatch",
    description:
      "תרומה למוקד החירום שלנו, שמסיים בכל דקה ומפעיל את המתנדב הקרוב ביותר לזירה — בכל שעה, בכל יום בשנה.",
    descriptionEn:
      "Supports our emergency dispatch center — running every minute, routing the nearest volunteer to the scene, every hour of every day.",
    impactText: "כל קריאה מנותבת לזירה תוך שניות",
    impactTextEn: "Every call routed to the scene within seconds",
    slug: "dispatch",
    cardType: "amount",
    totalAmount: 3600,
    defaultPayments: 18,
    icon: "phone",
  },
  {
    _id: "fallback-ambulance",
    name: "ציוד מציל חיים לאמבולנס",
    nameEn: "Ambulance life-saving equipment",
    description:
      "ציוד רפואי מתקדם לאמבולנס מבצעי — מוניטור, מכשירי החייאה ופריטי טיפול לאירועים מורכבים.",
    descriptionEn:
      "Advanced medical gear for an active ambulance — patient monitor, resuscitation tools and supplies for complex incidents.",
    impactText: "אמבולנס מצויד מטפל ב-1,200+ קריאות בשנה",
    impactTextEn: "An equipped ambulance handles 1,200+ calls a year",
    slug: "ambulance",
    cardType: "amount",
    totalAmount: 19200,
    defaultPayments: 24,
    icon: "ambulance",
  },
];

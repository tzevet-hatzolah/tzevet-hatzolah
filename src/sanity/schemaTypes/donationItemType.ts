import { defineField, defineType } from "sanity";

const ICON_OPTIONS = [
  { title: "לב (Heart)", value: "heart" },
  { title: "ערכת עזרה ראשונה (First-aid kit)", value: "kit" },
  { title: "דפיברילטור (Defibrillator)", value: "aed" },
  { title: "אמבולנס (Ambulance)", value: "ambulance" },
  { title: "צלב רפואי (Medical cross)", value: "cross" },
  { title: "מגן (Shield)", value: "shield" },
  { title: "טלפון חירום (Emergency phone)", value: "phone" },
  { title: "מתנדב (Volunteer)", value: "volunteer" },
];

export const donationItemType = defineType({
  name: "donationItem",
  title: "Donation Item",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "שם הכרטיס (Card name — Hebrew)",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "nameEn",
      title: "Card name (English)",
      type: "string",
    }),
    defineField({
      name: "description",
      title: "תיאור (Description — Hebrew)",
      type: "text",
      rows: 3,
      validation: (rule) => rule.required().max(220),
    }),
    defineField({
      name: "descriptionEn",
      title: "Description (English)",
      type: "text",
      rows: 3,
      validation: (rule) => rule.max(220),
    }),
    defineField({
      name: "impactText",
      title: "ההשפעה שלכם — שורת השפעה (Impact line — Hebrew)",
      type: "string",
      description:
        "שורת השפעה קצרה שמופיעה בחלון התרומה. דוגמה: \"מצילה חיים בעשרות אירועים\".",
      validation: (rule) => rule.max(120),
    }),
    defineField({
      name: "impactTextEn",
      title: "Impact line (English)",
      type: "string",
      description:
        "Short impact statement shown in the donation modal, e.g. \"Saves lives at dozens of incidents\".",
      validation: (rule) => rule.max(120),
    }),
    defineField({
      name: "highlight",
      title: "סמן ככרטיס מומלץ (Mark as recommended)",
      type: "boolean",
      description: "מסמן את הכרטיס בתווית \"הכי פופולרי\" בדף הבית.",
      initialValue: false,
    }),
    defineField({
      name: "slug",
      title: "Slug (used in donation URL)",
      type: "slug",
      options: { source: "nameEn", maxLength: 60 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "cardType",
      title: "סוג כרטיס (Card type)",
      type: "string",
      options: {
        list: [
          { title: "סכום חופשי (Custom amount — no preset)", value: "custom" },
          { title: "ציוד / סכום קבוע (Equipment / fixed amount)", value: "amount" },
        ],
        layout: "radio",
      },
      initialValue: "amount",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "totalAmount",
      title: "עלות הפריט בש״ח (Total cost, ₪)",
      type: "number",
      description:
        "העלות הכוללת של הפריט (לדוגמה, ₪8,100 לדפיברילטור). התורם בוחר בחלון כיצד לחלק לתשלומים.",
      hidden: ({ document }) => document?.cardType !== "amount",
      validation: (rule) =>
        rule.custom((value, context) => {
          const doc = context.document as { cardType?: string } | undefined;
          if (doc?.cardType !== "amount") return true;
          if (typeof value !== "number" || value < 18)
            return "Total must be at least ₪18";
          return true;
        }),
    }),
    defineField({
      name: "defaultPayments",
      title: "מספר תשלומים מומלץ (Recommended number of payments)",
      type: "number",
      description:
        "מספר התשלומים שמוצג בכרטיס בדף הבית. התורם יוכל לשנות בחלון. ברירת מחדל: 18 תשלומים.",
      initialValue: 18,
      hidden: ({ document }) => document?.cardType !== "amount",
      validation: (rule) =>
        rule.custom((value, context) => {
          const doc = context.document as {
            cardType?: string;
            totalAmount?: number;
          } | undefined;
          if (doc?.cardType !== "amount") return true;
          if (typeof value !== "number" || value < 1 || value > 36)
            return "Payments must be between 1 and 36";
          if (typeof doc.totalAmount === "number" && doc.totalAmount / value < 18)
            return "Resulting monthly payment must be at least ₪18";
          return true;
        }),
    }),
    defineField({
      name: "image",
      title: "תמונה (Image)",
      type: "image",
      description:
        "תמונה אופציונלית לכרטיס. אם אין תמונה, יוצג סמל לפי השדה למטה.",
      options: { hotspot: true },
      fields: [
        { name: "alt", title: "טקסט חלופי (Alt text)", type: "string" },
      ],
    }),
    defineField({
      name: "icon",
      title: "סמל (Icon — used when no image)",
      type: "string",
      options: { list: ICON_OPTIONS, layout: "dropdown" },
      initialValue: "heart",
    }),
    defineField({
      name: "showOnHomepage",
      title: "להציג בדף הבית (Show on homepage)",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "order",
      title: "סדר תצוגה (Display order)",
      type: "number",
      description: "מספר נמוך יותר יוצג קודם. ברירת מחדל: 100.",
      initialValue: 100,
    }),
  ],
  orderings: [
    {
      title: "Display Order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "name",
      cardType: "cardType",
      total: "totalAmount",
      payments: "defaultPayments",
      media: "image",
    },
    prepare({ title, cardType, total, payments, media }) {
      const n = payments ?? 18;
      const monthly = total ? Math.round(total / n) : 0;
      const subtitle =
        cardType === "amount" && total
          ? `₪${monthly} × ${n} = ₪${monthly * n}`
          : "סכום חופשי";
      return { title, subtitle, media };
    },
  },
});

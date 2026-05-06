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
      name: "monthlyAmount",
      title: "סכום חודשי בש״ח (Monthly amount, ₪)",
      type: "number",
      description:
        "הסכום החודשי שהתורם יחויב. השדה בשימוש רק עבור כרטיסי 'ציוד / סכום קבוע'.",
      hidden: ({ document }) => document?.cardType !== "amount",
      validation: (rule) =>
        rule.custom((value, context) => {
          const doc = context.document as { cardType?: string } | undefined;
          if (doc?.cardType !== "amount") return true;
          if (typeof value !== "number" || value < 1) return "Required for fixed-amount cards";
          return true;
        }),
    }),
    defineField({
      name: "months",
      title: "מספר חודשים (Number of months)",
      type: "number",
      description:
        "אורך מחזור החיוב. ברירת מחדל: 18 חודשים. בשימוש רק עבור כרטיסי 'ציוד / סכום קבוע'.",
      initialValue: 18,
      hidden: ({ document }) => document?.cardType !== "amount",
      validation: (rule) =>
        rule.custom((value, context) => {
          const doc = context.document as { cardType?: string } | undefined;
          if (doc?.cardType !== "amount") return true;
          if (typeof value !== "number" || value < 1 || value > 60)
            return "Months must be between 1 and 60";
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
      monthly: "monthlyAmount",
      months: "months",
      media: "image",
    },
    prepare({ title, cardType, monthly, months, media }) {
      const subtitle =
        cardType === "amount" && monthly
          ? `₪${monthly} × ${months ?? 18}`
          : "סכום חופשי";
      return { title, subtitle, media };
    },
  },
});

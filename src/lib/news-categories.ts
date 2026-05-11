export type NewsCategory =
  | "traffic"
  | "home_accidents"
  | "children"
  | "medical"
  | "fires"
  | "security"
  | "terror"
  | "other";

export const NEWS_CATEGORIES: { value: NewsCategory; title: string }[] = [
  { value: "traffic", title: "תאונות דרכים" },
  { value: "home_accidents", title: "תאונות ביתיות" },
  { value: "children", title: "ילדים" },
  { value: "medical", title: "אירוע רפואי" },
  { value: "fires", title: "שריפות" },
  { value: "security", title: "אבטחות" },
  { value: "terror", title: "פח״ע" },
  { value: "other", title: "אחר" },
];

export const NEWS_CATEGORY_VALUES: NewsCategory[] = NEWS_CATEGORIES.map(
  (c) => c.value
);

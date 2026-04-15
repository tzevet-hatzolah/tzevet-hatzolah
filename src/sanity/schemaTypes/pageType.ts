import { defineField, defineType } from "sanity";

export const pageType = defineType({
  name: "page",
  title: "Page",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "כותרת (Title)",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "titleEn",
      title: "Title (English)",
      type: "string",
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "תוכן (Body)",
      type: "blockContent",
    }),
    defineField({
      name: "bodyEn",
      title: "Body (English)",
      type: "blockContent",
    }),
    defineField({
      name: "heroImage",
      title: "Hero Image",
      type: "image",
      options: { hotspot: true },
      fields: [
        {
          name: "alt",
          type: "string",
          title: "טקסט חלופי (Alt Text)",
        },
      ],
    }),
    defineField({
      name: "seoDescription",
      title: "SEO Description (Hebrew)",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "seoDescriptionEn",
      title: "SEO Description (English)",
      type: "text",
      rows: 3,
    }),
  ],
  preview: {
    select: { title: "title" },
  },
});

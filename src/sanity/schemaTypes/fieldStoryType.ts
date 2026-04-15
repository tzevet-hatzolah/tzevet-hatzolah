import { defineField, defineType } from "sanity";

export const fieldStoryType = defineType({
  name: "fieldStory",
  title: "Field Story",
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
      name: "publishedAt",
      title: "Published At",
      type: "datetime",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "mainImage",
      title: "Main Image",
      type: "image",
      options: { hotspot: true },
      fields: [
        {
          name: "alt",
          type: "string",
          title: "טקסט חלופי (Alt Text)",
          validation: (rule) => rule.required(),
        },
      ],
    }),
    defineField({
      name: "location",
      title: "מיקום (Location)",
      type: "string",
    }),
    defineField({
      name: "excerpt",
      title: "תקציר (Excerpt)",
      type: "text",
      rows: 3,
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
  ],
  orderings: [
    {
      title: "Published Date, Newest",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      media: "mainImage",
      location: "location",
    },
    prepare({ title, media, location }) {
      return {
        title,
        subtitle: location || "",
        media,
      };
    },
  },
});

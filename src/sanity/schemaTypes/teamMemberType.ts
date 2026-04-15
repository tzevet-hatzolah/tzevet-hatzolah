import { defineField, defineType } from "sanity";

export const teamMemberType = defineType({
  name: "teamMember",
  title: "Team Member",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "שם (Name)",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "nameEn",
      title: "Name (English)",
      type: "string",
    }),
    defineField({
      name: "role",
      title: "תפקיד (Role)",
      type: "string",
    }),
    defineField({
      name: "roleEn",
      title: "Role (English)",
      type: "string",
    }),
    defineField({
      name: "image",
      title: "Photo",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "order",
      title: "Display Order",
      type: "number",
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
      subtitle: "role",
      media: "image",
    },
  },
});

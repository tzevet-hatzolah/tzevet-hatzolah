import { defineField, defineType } from "sanity";

export const siteSettingsType = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    defineField({
      name: "orgName",
      title: "שם הארגון (Organization Name)",
      type: "string",
    }),
    defineField({
      name: "orgNameEn",
      title: "Organization Name (English)",
      type: "string",
    }),
    defineField({
      name: "registrationNumber",
      title: "מספר עמותה (Registration Number)",
      type: "string",
    }),
    defineField({
      name: "phone",
      title: "טלפון (Phone)",
      type: "string",
    }),
    defineField({
      name: "email",
      title: "דואר אלקטרוני (Email)",
      type: "string",
    }),
    defineField({
      name: "whatsappNumber",
      title: "WhatsApp Number",
      type: "string",
      description: "Full international number, e.g. 972501234567",
    }),
    defineField({
      name: "address",
      title: "כתובת (Address)",
      type: "string",
    }),
    defineField({
      name: "socialLinks",
      title: "Social Media Links",
      type: "object",
      fields: [
        { name: "facebook", title: "Facebook", type: "url" },
        { name: "instagram", title: "Instagram", type: "url" },
        { name: "youtube", title: "YouTube", type: "url" },
        { name: "tiktok", title: "TikTok", type: "url" },
      ],
    }),
    defineField({
      name: "heroVideo",
      title: "Hero Background Video",
      type: "file",
      options: {
        accept: "video/mp4,video/webm",
      },
      description:
        "Background video for the homepage hero section. Keep under 15MB for fast loading. MP4 (H.264) recommended.",
    }),
    defineField({
      name: "heroVideoPoster",
      title: "Hero Video Poster (Fallback Image)",
      type: "image",
      description:
        "Shown while the video loads or on slow connections. Use a frame from the video.",
    }),
    defineField({
      name: "statsVolunteers",
      title: "Stats: Volunteers",
      type: "number",
    }),
    defineField({
      name: "statsCallsPerYear",
      title: "Stats: Calls per Year",
      type: "number",
    }),
    defineField({
      name: "statsYearsActive",
      title: "Stats: Years Active",
      type: "number",
    }),
    defineField({
      name: "accessibilityCoordinator",
      title: "Accessibility Coordinator Name",
      type: "string",
      description: "Required for IS 5568 compliance",
    }),
    defineField({
      name: "accessibilityCoordinatorEmail",
      title: "Accessibility Coordinator Email",
      type: "string",
    }),
    defineField({
      name: "accessibilityCoordinatorPhone",
      title: "Accessibility Coordinator Phone",
      type: "string",
    }),
  ],
  preview: {
    prepare() {
      return { title: "Site Settings" };
    },
  },
});

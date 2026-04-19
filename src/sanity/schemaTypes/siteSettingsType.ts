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
      description:
        "Links for the Footer 'Follow us' section. Leave a field blank to hide its icon. The WhatsApp Channel link is different from the WhatsApp Number above — that one is for direct contact.",
      fields: [
        {
          name: "whatsappChannel",
          title: "WhatsApp Channel",
          type: "url",
          description:
            "Public WhatsApp channel URL, e.g. https://whatsapp.com/channel/...",
        },
        { name: "telegram", title: "Telegram", type: "url" },
        { name: "instagram", title: "Instagram", type: "url" },
        { name: "youtube", title: "YouTube", type: "url" },
        { name: "facebook", title: "Facebook", type: "url" },
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
      title: "Hero Image / Video Poster",
      type: "image",
      description:
        "Used as the hero background when no video is set. If a video IS set, this image is shown while it loads and as a fallback on slow connections.",
    }),
    defineField({
      name: "missionVideo",
      title: "Mission Section Video",
      type: "file",
      options: {
        accept: "video/mp4,video/webm",
      },
      description:
        "Optional video shown in the 'Who We Are' section on the homepage. Plays with controls. Keep under 15MB. MP4 (H.264) recommended.",
    }),
    defineField({
      name: "missionImage",
      title: "Mission Section Image",
      type: "image",
      description:
        "Image shown in the 'Who We Are' section on the homepage when no video is set.",
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

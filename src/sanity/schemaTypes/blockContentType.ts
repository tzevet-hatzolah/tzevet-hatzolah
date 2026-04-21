import { defineType, defineArrayMember } from "sanity";
import { ImageIcon, PlayIcon } from "@sanity/icons";

const YOUTUBE_URL_REGEX =
  /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}/;

export const blockContentType = defineType({
  title: "Block Content",
  name: "blockContent",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [
        { title: "Normal", value: "normal" },
        { title: "H2", value: "h2" },
        { title: "H3", value: "h3" },
        { title: "H4", value: "h4" },
        { title: "Quote", value: "blockquote" },
      ],
      lists: [
        { title: "Bullet", value: "bullet" },
        { title: "Numbered", value: "number" },
      ],
      marks: {
        decorators: [
          { title: "Strong", value: "strong" },
          { title: "Emphasis", value: "em" },
        ],
        annotations: [
          {
            title: "URL",
            name: "link",
            type: "object",
            fields: [
              {
                title: "URL",
                name: "href",
                type: "url",
              },
            ],
          },
        ],
      },
    }),
    defineArrayMember({
      type: "image",
      icon: ImageIcon,
      options: { hotspot: true },
      fields: [
        {
          name: "alt",
          type: "string",
          title: "טקסט חלופי (Alt Text)",
          validation: (rule) => rule.required(),
        },
        {
          name: "altEn",
          type: "string",
          title: "Alt Text (English)",
        },
      ],
    }),
    defineArrayMember({
      name: "youtube",
      type: "object",
      title: "YouTube Video",
      icon: PlayIcon,
      fields: [
        {
          name: "url",
          type: "url",
          title: "YouTube URL",
          description:
            "Paste any YouTube link — full (youtube.com/watch?v=…), short (youtu.be/…), embed, or Shorts.",
          validation: (rule) =>
            rule
              .required()
              .custom((value) => {
                if (typeof value !== "string") return true;
                return YOUTUBE_URL_REGEX.test(value) || "Must be a valid YouTube URL";
              }),
        },
        {
          name: "title",
          type: "string",
          title: "Accessible title",
          description:
            "Shown to screen readers and search engines. Describes what the video is about.",
        },
      ],
      preview: {
        select: { url: "url", title: "title" },
        prepare({ url, title }: { url?: string; title?: string }) {
          return {
            title: title || "YouTube video",
            subtitle: url || "No URL set",
            media: PlayIcon,
          };
        },
      },
    }),
  ],
});

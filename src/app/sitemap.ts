import type { MetadataRoute } from "next";
import { groq } from "next-sanity";
import { client } from "@/sanity/lib/client";
import { siteUrl } from "@/lib/site";

const staticPaths = [
  "/",
  "/about",
  "/activities",
  "/contact",
  "/donate",
  "/news",
  "/stories",
  "/negishot",
  "/privacy",
  "/terms",
];

type SlugWithDate = { slug: string; updatedAt: string };

const newsForSitemapQuery = groq`
  *[_type == "newsArticle" && defined(slug.current)]{
    "slug": slug.current,
    "updatedAt": coalesce(_updatedAt, publishedAt)
  }
`;

const storiesForSitemapQuery = groq`
  *[_type == "fieldStory" && defined(slug.current)]{
    "slug": slug.current,
    "updatedAt": coalesce(_updatedAt, publishedAt)
  }
`;

function localizedEntry(
  path: string,
  lastModified?: string
): MetadataRoute.Sitemap[number] {
  const hePath = path === "/" ? "/" : path;
  const enPath = path === "/" ? "/en" : `/en${path}`;
  return {
    url: `${siteUrl}${hePath}`,
    lastModified: lastModified ? new Date(lastModified) : new Date(),
    alternates: {
      languages: {
        he: `${siteUrl}${hePath}`,
        en: `${siteUrl}${enPath}`,
        "x-default": `${siteUrl}${hePath}`,
      },
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [newsItems, storyItems] = await Promise.all([
    client.fetch<SlugWithDate[]>(newsForSitemapQuery).catch(() => []),
    client.fetch<SlugWithDate[]>(storiesForSitemapQuery).catch(() => []),
  ]);

  return [
    ...staticPaths.map((path) => localizedEntry(path)),
    ...newsItems.map((item) =>
      localizedEntry(`/news/${item.slug}`, item.updatedAt)
    ),
    ...storyItems.map((item) =>
      localizedEntry(`/stories/${item.slug}`, item.updatedAt)
    ),
  ];
}

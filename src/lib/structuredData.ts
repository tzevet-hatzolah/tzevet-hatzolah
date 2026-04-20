import { cache } from "react";
import { client } from "@/sanity/lib/client";
import { siteSettingsQuery } from "@/sanity/lib/queries";
import { siteUrl } from "./site";

export type OrgSettings = {
  orgName?: string;
  orgNameEn?: string;
  registrationNumber?: string;
  phone?: string;
  email?: string;
  whatsappNumber?: string;
  address?: string;
  socialLinks?: {
    whatsappChannel?: string;
    telegram?: string;
    instagram?: string;
    youtube?: string;
    facebook?: string;
  };
} | null;

export const getSiteSettings = cache(
  async (): Promise<OrgSettings> =>
    client.fetch<OrgSettings>(siteSettingsQuery)
);

const ORG_ID = `${siteUrl}/#organization`;

export function organizationSchema(settings: OrgSettings, locale: string) {
  const name =
    locale === "en"
      ? settings?.orgNameEn || settings?.orgName || "Tzevet Hatzolah"
      : settings?.orgName || "צוות הצלה";
  const alternateName =
    locale === "en" ? settings?.orgName : settings?.orgNameEn;

  const sameAs = [
    settings?.socialLinks?.facebook,
    settings?.socialLinks?.instagram,
    settings?.socialLinks?.youtube,
    settings?.socialLinks?.telegram,
    settings?.socialLinks?.whatsappChannel,
  ].filter((u): u is string => Boolean(u));

  const contactPoint =
    settings?.phone || settings?.email
      ? [
          {
            "@type": "ContactPoint",
            contactType: "customer service",
            ...(settings?.phone ? { telephone: settings.phone } : {}),
            ...(settings?.email ? { email: settings.email } : {}),
            availableLanguage: ["he", "en"],
          },
        ]
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "NGO",
    "@id": ORG_ID,
    name,
    ...(alternateName ? { alternateName } : {}),
    url: siteUrl,
    logo: `${siteUrl}/logo.jpg`,
    ...(settings?.registrationNumber ? { taxID: settings.registrationNumber } : {}),
    ...(contactPoint ? { contactPoint } : {}),
    ...(settings?.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: settings.address,
            addressCountry: "IL",
          },
        }
      : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export type ArticleSchemaInput = {
  title: string;
  titleEn?: string;
  slug: string;
  publishedAt: string;
  updatedAt?: string;
  excerpt?: string;
  mainImageUrl?: string | null;
};

export function newsArticleSchema(opts: {
  article: ArticleSchemaInput;
  locale: string;
  path: "news" | "stories";
}) {
  const { article, locale, path } = opts;
  const isEn = locale === "en";
  const headline = isEn ? article.titleEn || article.title : article.title;
  const url = isEn
    ? `${siteUrl}/en/${path}/${article.slug}`
    : `${siteUrl}/${path}/${article.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    headline,
    ...(article.excerpt ? { description: article.excerpt } : {}),
    ...(article.mainImageUrl ? { image: [article.mainImageUrl] } : {}),
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    inLanguage: isEn ? "en" : "he",
    publisher: { "@id": ORG_ID },
  };
}

export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

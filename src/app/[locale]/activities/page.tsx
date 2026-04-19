import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { client } from "@/sanity/lib/client";
import { pageBySlugQuery } from "@/sanity/lib/queries";
import { urlFor } from "@/sanity/lib/image";
import { alternateLinks } from "@/lib/seo";
import SanityPortableText from "@/components/SanityPortableText";
import type { PortableTextBlock } from "next-sanity";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "activities" });
  return {
    title: t("title"),
    alternates: alternateLinks("/activities"),
  };
}

type PageData = {
  title: string;
  titleEn?: string;
  body?: PortableTextBlock[];
  bodyEn?: PortableTextBlock[];
  heroImage?: { asset: { _ref: string }; alt?: string };
} | null;

export default async function ActivitiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const pageData = await client.fetch<PageData>(pageBySlugQuery, {
    slug: "activities",
  });

  return <ActivitiesContent pageData={pageData} locale={locale} />;
}

function ActivitiesContent({
  pageData,
  locale,
}: {
  pageData: PageData;
  locale: string;
}) {
  const t = useTranslations("activities");
  const isEn = locale === "en";

  const body = isEn ? pageData?.bodyEn || pageData?.body : pageData?.body;
  const hasContent = body && body.length > 0;

  return (
    <main className="flex-1">
      <section className="page-header text-white py-16 md:py-20 px-6 text-center">
        <div className="relative z-10">
          <div className="section-line mx-auto mb-5" />
          <h1 className="text-3xl md:text-4xl font-[number:var(--font-weight-black)]">
            {t("title")}
          </h1>
        </div>
      </section>

      {/* Hero image */}
      {pageData?.heroImage?.asset && (
        <section className="px-6">
          <div className="max-w-4xl mx-auto -mt-8 relative">
            <Image
              src={urlFor(pageData.heroImage).width(1200).height(500).auto("format").url()}
              alt={pageData.heroImage.alt || t("title")}
              width={1200}
              height={500}
              className="rounded-[var(--radius-xl)] w-full h-auto shadow-[var(--shadow-elevated)]"
              priority
            />
          </div>
        </section>
      )}

      <section className="py-16 md:py-20 px-6">
        <div className="max-w-3xl mx-auto">
          {hasContent ? (
            <SanityPortableText value={body} />
          ) : (
            <div className="card p-10 text-center text-muted">
              <p>תוכן העמוד ייטען מ-Sanity CMS</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

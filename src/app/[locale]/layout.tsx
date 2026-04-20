import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { alternateLinks } from "@/lib/seo";
import {
  getSiteSettings,
  jsonLdScript,
  organizationSchema,
} from "@/lib/structuredData";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const title = t("title");
  return {
    title: {
      absolute: title,
      template: `%s | ${title}`,
    },
    description: t("description"),
    alternates: alternateLinks("/"),
    openGraph: {
      locale: locale === "he" ? "he_IL" : "en_US",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const settings = await getSiteSettings();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(organizationSchema(settings, locale)),
        }}
      />
      <Header />
      {children}
      <Footer />
    </>
  );
}

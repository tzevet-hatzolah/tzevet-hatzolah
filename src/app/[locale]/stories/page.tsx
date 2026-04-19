import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import { client } from "@/sanity/lib/client";
import { fieldStoriesQuery } from "@/sanity/lib/queries";
import { urlFor } from "@/sanity/lib/image";
import { alternateLinks } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "stories_page" });
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: alternateLinks("/stories"),
  };
}

type FieldStory = {
  _id: string;
  title: string;
  titleEn?: string;
  slug: string;
  publishedAt: string;
  mainImage?: { asset: { _ref: string }; alt?: string };
  location?: string;
  excerpt?: string;
};

export default async function StoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const stories = await client.fetch<FieldStory[]>(fieldStoriesQuery);

  return <StoriesContent stories={stories ?? []} locale={locale} />;
}

function StoriesContent({
  stories,
  locale,
}: {
  stories: FieldStory[];
  locale: string;
}) {
  const t = useTranslations("stories_page");
  const isEn = locale === "en";

  return (
    <main className="flex-1">
      <section className="page-header text-white py-12 sm:py-16 md:py-20 px-5 sm:px-6 text-center">
        <div className="relative z-10">
          <div className="section-line mx-auto mb-4 sm:mb-5" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-[number:var(--font-weight-black)]">
            {t("title")}
          </h1>
          <p className="text-white/70 text-sm sm:text-base mt-3 max-w-xl mx-auto">
            {t("subtitle")}
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {stories.length === 0 ? (
            <p className="text-center text-muted">{t("empty")}</p>
          ) : (
            <div className="flex flex-col gap-6 sm:gap-8">
              {stories.map((story, i) => {
                const title = isEn ? story.titleEn || story.title : story.title;
                return (
                  <AnimateOnScroll key={story._id} animation="fade-up" delay={i * 80}>
                    <Link href={`/stories/${story.slug}`}>
                      <article className="card group cursor-pointer md:grid md:grid-cols-[260px_1fr] md:gap-6 overflow-hidden border-r-4 border-gold-500/80 hover:border-gold-500">
                        {story.mainImage?.asset && (
                          <div className="aspect-video md:aspect-auto md:h-full relative overflow-hidden img-zoom">
                            <Image
                              src={urlFor(story.mainImage).width(520).height(400).auto("format").url()}
                              alt={story.mainImage.alt || title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="p-5 sm:p-[var(--spacing-card)] flex flex-col justify-center">
                          {story.location && (
                            <span className="inline-flex items-center gap-1.5 text-gold-700 text-xs font-bold mb-2">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                              </svg>
                              {story.location}
                            </span>
                          )}
                          <h2 className="text-charcoal text-lg sm:text-xl font-bold group-hover:text-navy-600 transition-colors duration-300">
                            {title}
                          </h2>
                          {story.excerpt && (
                            <p className="text-muted text-sm mt-2 leading-relaxed line-clamp-3">
                              {story.excerpt}
                            </p>
                          )}
                          <p className="text-muted text-xs mt-3">
                            {new Date(story.publishedAt).toLocaleDateString(
                              isEn ? "en-US" : "he-IL",
                              { year: "numeric", month: "long", day: "numeric" }
                            )}
                          </p>
                        </div>
                      </article>
                    </Link>
                  </AnimateOnScroll>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

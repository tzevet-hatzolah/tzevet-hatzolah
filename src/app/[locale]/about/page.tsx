import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { client } from "@/sanity/lib/client";
import { pageBySlugQuery, teamMembersQuery } from "@/sanity/lib/queries";
import { urlFor } from "@/sanity/lib/image";
import SanityPortableText from "@/components/SanityPortableText";
import type { PortableTextBlock } from "next-sanity";

type PageData = {
  title: string;
  titleEn?: string;
  body?: PortableTextBlock[];
  bodyEn?: PortableTextBlock[];
  heroImage?: { asset: { _ref: string }; alt?: string };
} | null;

type TeamMember = {
  _id: string;
  name: string;
  nameEn?: string;
  role?: string;
  roleEn?: string;
  image?: { asset: { _ref: string } };
};

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [pageData, teamMembers] = await Promise.all([
    client.fetch<PageData>(pageBySlugQuery, { slug: "about" }),
    client.fetch<TeamMember[]>(teamMembersQuery),
  ]);

  return (
    <AboutContent
      pageData={pageData}
      teamMembers={teamMembers ?? []}
      locale={locale}
    />
  );
}

function AboutContent({
  pageData,
  teamMembers,
  locale,
}: {
  pageData: PageData;
  teamMembers: TeamMember[];
  locale: string;
}) {
  const t = useTranslations("about");
  const isEn = locale === "en";

  const body = isEn ? pageData?.bodyEn || pageData?.body : pageData?.body;
  const hasContent = body && body.length > 0;

  return (
    <main className="flex-1">
      {/* Page header */}
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

      {/* Content */}
      <section className="py-16 md:py-20 px-6">
        <div className="max-w-3xl mx-auto">
          {hasContent ? (
            <SanityPortableText value={body} />
          ) : (
            <div className="card p-10 text-center text-muted">
              <p>תוכן העמוד ייטען מ-Sanity CMS</p>
            </div>
          )}

          {/* Team members */}
          {teamMembers.length > 0 && (
            <div className="mt-16">
              <h2 className="text-xl sm:text-2xl font-bold mb-8 text-charcoal">
                {isEn ? "Our Team" : "הצוות שלנו"}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {teamMembers.map((member) => (
                  <div key={member._id} className="text-center">
                    <div className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-3 bg-stone">
                      {member.image?.asset ? (
                        <Image
                          src={urlFor(member.image).width(200).height(200).auto("format").url()}
                          alt={isEn ? member.nameEn || member.name : member.name}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted text-2xl font-bold">
                          {member.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium text-charcoal text-sm">
                      {isEn ? member.nameEn || member.name : member.name}
                    </h3>
                    {(member.role || member.roleEn) && (
                      <p className="text-muted text-xs mt-1">
                        {isEn ? member.roleEn || member.role : member.role}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-14 text-center">
            <Link href="/donate" className="btn-donate text-lg px-10 py-3.5">
              {isEn ? "Donate Now" : "תרמו עכשיו"}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

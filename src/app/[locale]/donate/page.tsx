import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import DonateForm from "@/components/DonateForm";
import DonateSummary from "@/components/DonateSummary";
import DonateInteractive from "@/components/DonateInteractive";
import TrustStrip from "@/components/TrustStrip";
import { client } from "@/sanity/lib/client";
import {
  donationItemBySlugQuery,
  siteSettingsQuery,
} from "@/sanity/lib/queries";
import { alternateLinks } from "@/lib/seo";
import {
  type DonationItem,
  DONATION_MIN_MONTHLY,
  DONATION_MAX_PAYMENTS,
  FALLBACK_DONATION_ITEMS,
  monthlyFor,
} from "@/lib/donation-types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "donate" });
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: alternateLinks("/donate"),
  };
}

type SiteSettings = { registrationNumber?: string } | null;

const DEFAULT_PAYMENTS = 18;

function parseSelection(searchParams: Record<string, string | string[] | undefined>) {
  const totalRaw = searchParams.total;
  const paymentsRaw = searchParams.payments;
  const itemSlug = typeof searchParams.item === "string" ? searchParams.item : null;

  const total =
    typeof totalRaw === "string" ? parseInt(totalRaw, 10) : NaN;
  const payments =
    typeof paymentsRaw === "string" ? parseInt(paymentsRaw, 10) : NaN;

  if (
    Number.isFinite(total) &&
    total >= DONATION_MIN_MONTHLY &&
    Number.isFinite(payments) &&
    payments >= 1 &&
    payments <= DONATION_MAX_PAYMENTS &&
    monthlyFor(total, payments) >= DONATION_MIN_MONTHLY
  ) {
    return { total, payments, itemSlug };
  }
  return null;
}

export default async function DonatePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);

  const selection = parseSelection(sp);

  const [sanityItem, settings] = await Promise.all([
    selection?.itemSlug
      ? client
          .fetch<DonationItem | null>(donationItemBySlugQuery, {
            slug: selection.itemSlug,
          })
          .catch(() => null)
      : Promise.resolve(null),
    client.fetch<SiteSettings>(siteSettingsQuery).catch(() => null),
  ]);

  const item =
    sanityItem ??
    (selection?.itemSlug
      ? FALLBACK_DONATION_ITEMS.find((f) => f.slug === selection.itemSlug) ?? null
      : null);

  const registrationNumber = settings?.registrationNumber ?? "580540565";

  return (
    <DonateContent
      locale={locale}
      selection={selection}
      item={item}
      registrationNumber={registrationNumber}
    />
  );
}

function DonateContent({
  locale,
  selection,
  item,
  registrationNumber,
}: {
  locale: string;
  selection: { total: number; payments: number; itemSlug: string | null } | null;
  item: DonationItem | null;
  registrationNumber: string;
}) {
  const t = useTranslations("donate");

  const hasSelection = selection !== null;
  const total = selection?.total ?? 0;
  const payments = selection?.payments ?? DEFAULT_PAYMENTS;

  return (
    <main className="flex-1">
      <section className="page-header relative text-white text-center overflow-hidden py-3 sm:py-4 px-5 sm:px-6">
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="section-line mx-auto mb-2" />
          <h1 className="text-lg sm:text-xl md:text-2xl font-[number:var(--font-weight-black)] drop-shadow-sm">
            {t("title")}
          </h1>
          {t("subtitle") && (
            <p className="text-white/70 text-xs sm:text-sm mt-1 max-w-xl mx-auto">
              {t("subtitle")}
            </p>
          )}
        </div>
      </section>

      <section className="py-3 sm:py-5 px-4 sm:px-6 pb-24 md:pb-12">
        <div className="max-w-xl mx-auto space-y-6 sm:space-y-7">
          {hasSelection && item ? (
            <>
              <AnimateOnScroll animation="fade-up">
                <DonateSummary
                  item={item}
                  total={total}
                  payments={payments}
                  locale={locale}
                />
              </AnimateOnScroll>

              <AnimateOnScroll animation="fade-up" delay={100}>
                <TrustStrip registrationNumber={registrationNumber} />
              </AnimateOnScroll>

              <AnimateOnScroll animation="fade-up" delay={180}>
                <div className="card p-5 sm:p-7 md:p-8">
                  <DonateForm
                    total={total}
                    payments={payments}
                    itemSlug={selection.itemSlug}
                  />
                </div>
              </AnimateOnScroll>
            </>
          ) : (
            <DonateInteractive registrationNumber={registrationNumber} />
          )}
        </div>
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import PageHeader from "@/components/PageHeader";
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
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <section className="py-10 sm:py-14 md:py-16 px-4 sm:px-6">
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

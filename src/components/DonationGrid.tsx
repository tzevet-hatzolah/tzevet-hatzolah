"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import DonationModal from "@/components/DonationModal";
import { urlFor } from "@/sanity/lib/image";
import {
  type DonationItem,
  type DonationIconKey,
  monthlyFor,
} from "@/lib/donation-types";
import { DONATION_ICONS } from "@/components/DonationIcons";

export default function DonationGrid({
  items,
  locale,
}: {
  items: DonationItem[];
  locale: string;
}) {
  const t = useTranslations("home.donate_block");
  const [selected, setSelected] = useState<DonationItem | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
        {items.map((item, i) => (
          <DonationOptionCard
            key={item._id}
            item={item}
            locale={locale}
            delay={i * 90}
            onSelect={() => setSelected(item)}
          />
        ))}
      </div>

      <AnimateOnScroll animation="fade-up" delay={500}>
        <div className="text-center mt-9 sm:mt-12">
          <Link
            href="/donate"
            className="inline-flex items-center gap-2 text-navy-600 hover:text-navy-950 text-sm sm:text-base font-medium transition-colors duration-300"
          >
            {t("more")}
            <span className="text-lg leading-none">&larr;</span>
          </Link>
        </div>
      </AnimateOnScroll>

      {selected ? (
        <DonationModal
          item={selected}
          locale={locale}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </>
  );
}

function DonationOptionCard({
  item,
  locale,
  delay,
  onSelect,
}: {
  item: DonationItem;
  locale: string;
  delay: number;
  onSelect: () => void;
}) {
  const t = useTranslations("home.donate_block");
  const isCustom = item.cardType === "custom";

  const total = item.totalAmount ?? 0;
  const payments = item.defaultPayments ?? 18;
  const monthly = !isCustom && total ? monthlyFor(total, payments) : 0;
  const billedTotal = monthly * payments;

  const name = locale === "en" && item.nameEn ? item.nameEn : item.name;
  const description =
    locale === "en" && item.descriptionEn ? item.descriptionEn : item.description;

  const iconKey: DonationIconKey = item.icon ?? "heart";
  const Icon = DONATION_ICONS[iconKey] ?? DONATION_ICONS.heart;

  const imageUrl = item.image?.asset
    ? urlFor(item.image).width(640).height(400).auto("format").url()
    : null;

  const cardInner = (
    <div
      className={`relative h-full flex flex-col rounded-[var(--radius-xl)] overflow-hidden transition-all duration-300 hover-lift ${
        isCustom
          ? "bg-gradient-to-br from-gold-300 to-gold-500 text-navy-950 ring-1 ring-gold-300/50"
          : "bg-warm-white text-charcoal ring-1 ring-white/10"
      } shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)]`}
    >
      {item.highlight ? (
        <span className="absolute top-3 end-3 z-10 inline-block bg-gradient-to-l from-gold-300 to-gold-500 text-navy-950 text-[10px] sm:text-xs font-[number:var(--font-weight-black)] tracking-wide px-2.5 py-1 rounded-full shadow-[var(--shadow-glow-gold)]">
          {t("popular")}
        </span>
      ) : null}

      {imageUrl ? (
        <div className="relative h-32 sm:h-36 overflow-hidden img-zoom">
          <Image
            src={imageUrl}
            alt={item.image?.alt || name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      ) : (
        <div
          className={`flex items-center justify-center h-28 sm:h-32 ${
            isCustom
              ? "bg-gold-50/40"
              : "bg-gradient-to-br from-stone to-navy-50"
          }`}
        >
          <Icon
            className={
              isCustom
                ? "text-navy-800"
                : "text-navy-600 group-hover:text-red-600 transition-colors duration-300"
            }
          />
        </div>
      )}

      <div className="flex-1 flex flex-col p-5 sm:p-6">
        <h3
          className={`text-base sm:text-lg leading-snug mb-2 ${
            isCustom ? "text-navy-950" : "text-charcoal"
          }`}
        >
          {name}
        </h3>

        <p
          className={`text-xs sm:text-sm leading-relaxed mb-5 line-clamp-3 ${
            isCustom ? "text-navy-950/80" : "text-dark/80"
          }`}
        >
          {description}
        </p>

        {!isCustom && monthly ? (
          <div className="mb-5 mt-auto">
            <div className="text-2xl sm:text-3xl font-[number:var(--font-weight-black)] text-gold-700 leading-none mb-1.5">
              {payments === 1
                ? t("single_payment_format", {
                    total: billedTotal.toLocaleString("he-IL"),
                  })
                : t("payment_plan_format", {
                    amount: monthly.toLocaleString("he-IL"),
                    payments,
                  })}
            </div>
            <div className="text-sm sm:text-base font-[number:var(--font-weight-medium)] text-dark/75">
              {t("total_format", { total: billedTotal.toLocaleString("he-IL") })}
            </div>
          </div>
        ) : (
          <div className="mt-auto" />
        )}

        <span
          className={`inline-flex items-center justify-center font-bold rounded-[var(--radius-md)] py-2.5 sm:py-3 text-sm sm:text-base transition-all duration-300 ${
            isCustom
              ? "bg-navy-800 text-white group-hover:bg-navy-950"
              : "bg-red-600 text-white group-hover:bg-red-800 group-hover:shadow-[var(--shadow-glow-red)]"
          }`}
        >
          {t("donate_now")}
        </span>
      </div>
    </div>
  );

  return (
    <AnimateOnScroll animation="fade-up" delay={delay}>
      {isCustom ? (
        <Link href="/donate" className="block h-full group">
          {cardInner}
        </Link>
      ) : (
        <button
          type="button"
          onClick={onSelect}
          className="block h-full w-full text-start group cursor-pointer"
          aria-label={name}
        >
          {cardInner}
        </button>
      )}
    </AnimateOnScroll>
  );
}

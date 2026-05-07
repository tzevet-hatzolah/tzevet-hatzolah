import Image from "next/image";
import { useTranslations } from "next-intl";
import { urlFor } from "@/sanity/lib/image";
import { type DonationItem, monthlyFor } from "@/lib/donation-types";
import { DONATION_ICONS } from "@/components/DonationIcons";
import EditDonationButton from "@/components/EditDonationButton";

export default function DonateSummary({
  item,
  total,
  payments,
  locale,
}: {
  item: DonationItem;
  total: number;
  payments: number;
  locale: string;
}) {
  const t = useTranslations("donate.summary");

  const monthly = monthlyFor(total, payments);
  const name = locale === "en" && item.nameEn ? item.nameEn : item.name;

  const Icon = DONATION_ICONS[item.icon ?? "heart"] ?? DONATION_ICONS.heart;
  const imageUrl = item.image?.asset
    ? urlFor(item.image).width(280).height(280).auto("format").url()
    : null;

  return (
    <div className="bg-warm-white rounded-[var(--radius-xl)] shadow-[var(--shadow-card)] overflow-hidden">
      <div className="flex items-stretch gap-4 sm:gap-5 p-4 sm:p-5">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-[var(--radius-md)] overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={item.image?.alt || name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 80px, 96px"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-stone to-navy-50 flex items-center justify-center">
              <Icon className="text-navy-600 w-10 h-10" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="text-[10px] sm:text-xs font-[number:var(--font-weight-bold)] text-gold-700 tracking-wide mb-1">
              {t("heading")}
            </div>
            <h2 className="text-base sm:text-lg font-[number:var(--font-weight-bold)] text-navy-950 leading-tight truncate">
              {name}
            </h2>
            <div className="text-sm sm:text-base font-[number:var(--font-weight-bold)] text-gold-700 mt-1">
              {payments === 1
                ? t("single_payment_format", { total: total.toLocaleString("he-IL") })
                : t("plan_format", {
                    amount: `₪${monthly.toLocaleString("he-IL")}`,
                    payments,
                  })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between bg-stone/50 px-4 sm:px-5 py-3 border-t border-dark/5">
        <span className="text-xs sm:text-sm text-dark/75">{t("total_label")}</span>
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-base sm:text-lg font-[number:var(--font-weight-black)] text-navy-950 tabular-nums">
            ₪{(monthly * payments).toLocaleString("he-IL")}
          </span>
          <EditDonationButton item={item} locale={locale} payments={payments} />
        </div>
      </div>
    </div>
  );
}

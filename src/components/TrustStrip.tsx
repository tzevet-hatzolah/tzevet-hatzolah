import { useTranslations } from "next-intl";

export default function TrustStrip({
  registrationNumber,
}: {
  registrationNumber: string;
}) {
  const t = useTranslations("donate.trust_strip");

  const items = [
    { key: "ssl", icon: <LockIcon />, text: t("ssl") },
    {
      key: "amuta",
      icon: <BadgeIcon />,
      text: t("amuta", { number: registrationNumber }),
    },
    { key: "tax", icon: <ReceiptIcon />, text: t("tax") },
  ];

  return (
    <div className="rounded-[var(--radius-xl)] bg-stone/50 border border-dark/[0.05] px-3 sm:px-4 py-3 sm:py-3.5">
      <ul className="grid grid-cols-3 gap-2 sm:gap-3">
        {items.map((item) => (
          <li
            key={item.key}
            className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 text-center sm:text-start"
          >
            <span className="shrink-0 inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-navy-50 text-navy-600 ring-1 ring-navy-100">
              {item.icon}
            </span>
            <span className="text-[10px] sm:text-xs leading-tight text-charcoal/90 font-[number:var(--font-weight-bold)]">
              {item.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function BadgeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 3h14v18l-3-2-3 2-2-2-3 2-3-2V3z" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
    </svg>
  );
}

import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { client } from "@/sanity/lib/client";
import { siteSettingsQuery } from "@/sanity/lib/queries";

type SiteSettings = {
  accessibilityCoordinator?: string;
  accessibilityCoordinatorEmail?: string;
  accessibilityCoordinatorPhone?: string;
} | null;

export default async function AccessibilityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const settings = await client.fetch<SiteSettings>(siteSettingsQuery);

  return <AccessibilityContent settings={settings} locale={locale} />;
}

function AccessibilityContent({
  settings,
  locale,
}: {
  settings: SiteSettings;
  locale: string;
}) {
  const t = useTranslations("accessibility_page");
  const isEn = locale === "en";

  const coordinatorName =
    settings?.accessibilityCoordinator ||
    (isEn ? "To be confirmed" : "ימולא על ידי הלקוח");
  const coordinatorEmail =
    settings?.accessibilityCoordinatorEmail ||
    (isEn ? "To be confirmed" : "ימולא על ידי הלקוח");
  const coordinatorPhone =
    settings?.accessibilityCoordinatorPhone ||
    (isEn ? "To be confirmed" : "ימולא על ידי הלקוח");

  return (
    <main className="flex-1">
      <section className="bg-navy-600 text-white py-14 px-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold">{t("title")}</h1>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto prose-like">
          <h2>{isEn ? "Accessibility Statement" : "הצהרת נגישות"}</h2>
          <p className="text-dark leading-[var(--line-height-body)] mt-4">
            {isEn
              ? "Tzevet Hatzolah is committed to making our website accessible to people with disabilities, in accordance with Israeli Standard IS 5568 and WCAG 2.0 Level AA guidelines."
              : "צוות הצלה מחויב להנגשת האתר לאנשים עם מוגבלויות, בהתאם לתקן הישראלי IS 5568 ולהנחיות WCAG 2.0 ברמה AA."}
          </p>
          <p className="text-dark leading-[var(--line-height-body)] mt-4">
            {isEn
              ? "We continuously work to improve the accessibility of our website and digital services, and ensure compliance with legal requirements."
              : "אנו פועלים באופן שוטף לשיפור הנגישות של האתר ושל השירותים הדיגיטליים שלנו, ומקפידים על עמידה בדרישות החוק."}
          </p>

          <h2 className="mt-8">
            {isEn ? "Accessibility Coordinator" : "רכז/ת נגישות"}
          </h2>
          <div className="bg-stone rounded-[var(--radius-lg)] p-6 mt-4">
            <p className="text-dark text-sm">
              <strong>{isEn ? "Name:" : "שם:"}</strong> {coordinatorName}
            </p>
            <p className="text-dark text-sm mt-2">
              <strong>{isEn ? "Email:" : 'דוא"ל:'}</strong>{" "}
              {settings?.accessibilityCoordinatorEmail ? (
                <a
                  href={`mailto:${coordinatorEmail}`}
                  className="text-navy-400 hover:text-navy-600 transition-colors"
                >
                  {coordinatorEmail}
                </a>
              ) : (
                coordinatorEmail
              )}
            </p>
            <p className="text-dark text-sm mt-2">
              <strong>{isEn ? "Phone:" : "טלפון:"}</strong>{" "}
              {settings?.accessibilityCoordinatorPhone ? (
                <a
                  href={`tel:${coordinatorPhone}`}
                  className="text-navy-400 hover:text-navy-600 transition-colors"
                >
                  {coordinatorPhone}
                </a>
              ) : (
                coordinatorPhone
              )}
            </p>
          </div>

          <h2 className="mt-8">{isEn ? "Contact Us" : "פנו אלינו"}</h2>
          <p className="text-dark leading-[var(--line-height-body)] mt-4">
            {isEn
              ? "If you encounter an accessibility issue on our website, we would be happy to hear about it and address it promptly. You can contact the accessibility coordinator using the details above."
              : "אם נתקלתם בבעיית נגישות באתר, נשמח לשמוע ולטפל בכך בהקדם. ניתן לפנות לרכז/ת הנגישות באמצעות פרטי הקשר המופיעים למעלה."}
          </p>
        </div>
      </section>
    </main>
  );
}

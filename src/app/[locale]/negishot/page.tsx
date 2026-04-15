import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

export default async function AccessibilityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AccessibilityContent />;
}

function AccessibilityContent() {
  const t = useTranslations("accessibility_page");

  return (
    <main className="flex-1">
      <section className="bg-navy-600 text-white py-14 px-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold">{t("title")}</h1>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto prose-like">
          {/* IS 5568 required content — placeholder until real content from client */}
          <h2>הצהרת נגישות</h2>
          <p className="text-dark leading-[var(--line-height-body)] mt-4">
            צוות הצלה מחויב להנגשת האתר לאנשים עם מוגבלויות, בהתאם לתקן הישראלי
            IS 5568 ולהנחיות WCAG 2.0 ברמה AA.
          </p>
          <p className="text-dark leading-[var(--line-height-body)] mt-4">
            אנו פועלים באופן שוטף לשיפור הנגישות של האתר ושל השירותים הדיגיטליים
            שלנו, ומקפידים על עמידה בדרישות החוק.
          </p>

          <h2 className="mt-8">רכז/ת נגישות</h2>
          <div className="bg-stone rounded-[var(--radius-lg)] p-6 mt-4">
            <p className="text-dark text-sm">
              <strong>שם:</strong> ימולא על ידי הלקוח
            </p>
            <p className="text-dark text-sm mt-2">
              <strong>דוא&quot;ל:</strong> ימולא על ידי הלקוח
            </p>
            <p className="text-dark text-sm mt-2">
              <strong>טלפון:</strong> ימולא על ידי הלקוח
            </p>
          </div>

          <h2 className="mt-8">פנו אלינו</h2>
          <p className="text-dark leading-[var(--line-height-body)] mt-4">
            אם נתקלתם בבעיית נגישות באתר, נשמח לשמוע ולטפל בכך בהקדם. ניתן
            לפנות לרכז/ת הנגישות באמצעות פרטי הקשר המופיעים למעלה.
          </p>
        </div>
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { alternateLinks } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy_page" });
  return {
    title: t("title"),
    alternates: alternateLinks("/privacy"),
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PrivacyContent />;
}

function PrivacyContent() {
  const t = useTranslations("privacy_page");

  return (
    <main className="flex-1">
      <section className="bg-navy-600 text-white py-14 px-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold">{t("title")}</h1>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2>כללי</h2>
          <p className="text-dark leading-[var(--line-height-body)] mt-4">
            צוות הצלה מכבד את פרטיות המשתמשים באתר. מדיניות פרטיות זו מסבירה
            כיצד אנו אוספים, משתמשים ומגנים על המידע האישי שלכם.
          </p>

          <h2 className="mt-8">מידע שאנו אוספים</h2>
          <p className="text-dark leading-[var(--line-height-body)] mt-4">
            אנו עשויים לאסוף מידע אישי שאתם מספקים לנו באמצעות טופס יצירת קשר
            (שם, דוא&quot;ל, טלפון), וכן מידע טכני באמצעות כלי אנליטיקה.
          </p>

          <h2 className="mt-8">תרומות</h2>
          <p className="text-dark leading-[var(--line-height-body)] mt-4">
            תהליך התרומה מתבצע באמצעות ספקי תשלום חיצוניים (Sumit / JGive).
            האתר אינו שומר פרטי אמצעי תשלום. מדיניות הפרטיות של ספקי התשלום
            חלה על עסקאות אלה.
          </p>

          <h2 className="mt-8">מחיקת מידע</h2>
          <p className="text-dark leading-[var(--line-height-body)] mt-4">
            ניתן לבקש מחיקה של מידע אישי שנאסף על ידינו באמצעות שליחת בקשה
            לכתובת office@tzevethatzolah.com. נמחק את המידע מהמערכות שלנו תוך
            30 ימים ממועד קבלת הבקשה, למעט מידע שאנו מחויבים לשמור על פי דין.
          </p>

          <h2 className="mt-8">יצירת קשר</h2>
          <p className="text-dark leading-[var(--line-height-body)] mt-4">
            לכל שאלה בנושא פרטיות, ניתן לפנות אלינו בכתובת: office@tzevethatzolah.com
          </p>
        </div>
      </section>
    </main>
  );
}

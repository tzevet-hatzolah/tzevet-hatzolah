import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <TermsContent />;
}

function TermsContent() {
  const t = useTranslations("terms_page");

  return (
    <main className="flex-1">
      <section className="bg-navy-600 text-white py-14 px-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold">{t("title")}</h1>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2>כללי</h2>
          <p className="text-dark leading-[var(--line-height-body)] mt-4">
            השימוש באתר צוות הצלה כפוף לתנאים המפורטים להלן. השימוש באתר
            מהווה הסכמה לתנאים אלה.
          </p>

          <h2 className="mt-8">שימוש באתר</h2>
          <p className="text-dark leading-[var(--line-height-body)] mt-4">
            האתר מיועד למתן מידע על ארגון צוות הצלה, פעילותו, ולאפשר ביצוע
            תרומות. אין להשתמש באתר לכל מטרה בלתי חוקית.
          </p>

          <h2 className="mt-8">קניין רוחני</h2>
          <p className="text-dark leading-[var(--line-height-body)] mt-4">
            כל התכנים באתר, לרבות טקסטים, תמונות, לוגו וגרפיקה, הם רכוש צוות
            הצלה ומוגנים על ידי חוקי זכויות יוצרים.
          </p>

          <h2 className="mt-8">הגבלת אחריות</h2>
          <p className="text-dark leading-[var(--line-height-body)] mt-4">
            האתר מסופק &quot;כמו שהוא&quot; (as is). צוות הצלה אינו מתחייב
            לזמינות רציפה של האתר ואינו אחראי לנזקים הנובעים מהשימוש בו.
          </p>
        </div>
      </section>
    </main>
  );
}

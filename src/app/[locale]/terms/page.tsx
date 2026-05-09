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
  const t = await getTranslations({ locale, namespace: "terms_page" });
  return {
    title: t("title"),
    alternates: alternateLinks("/terms"),
  };
}

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
          <h2>תנאי שימוש באתר &quot;צוות הצלה&quot;</h2>
          <p className="text-dark leading-[var(--line-height-body)] mt-4">
            ברוכים הבאים לאתר של ארגון &quot;צוות הצלה&quot; (להלן:{" "}
            <strong>&quot;העמותה&quot;</strong>). השימוש באתר, בתכנים ובשירותים
            המוצעים בו כפוף לתנאי השימוש המפורטים להלן. הגלישה באתר או השימוש
            בשירותיו (כגון תרומה או יצירת קשר) מהווים הסכמה מצדכם לתנאים אלו.
          </p>

          <h2 className="mt-8">1. כללי</h2>
          <ul className="text-dark leading-[var(--line-height-body)] mt-4 list-disc pr-6 space-y-2">
            <li>
              האתר מופעל על ידי עמותת צוות הצלה (ע&quot;ר) ונועד לספק מידע על
              פעילות הארגון, לאפשר יצירת קשר ואיסוף תרומות לפעילות העמותה.
            </li>
            <li>
              התנאים חלים על כל משתמש באתר, בין אם הוא גולש מזדמן ובין אם הוא
              תורם.
            </li>
            <li>
              העמותה שומרת לעצמה את הזכות לעדכן את תנאי השימוש מעת לעת, ללא
              הודעה מוקדמת.
            </li>
          </ul>

          <h2 className="mt-8">2. קניין רוחני</h2>
          <ul className="text-dark leading-[var(--line-height-body)] mt-4 list-disc pr-6 space-y-2">
            <li>
              כל התכנים המופיעים באתר, לרבות טקסטים, תמונות, לוגואים, סרטונים,
              עיצובים וקוד המקור, הם רכושה הבלעדי של העמותה (או של צדדים
              שלישיים שהתירו לעמותה להשתמש בהם) ומוגנים בזכויות יוצרים.
            </li>
            <li>
              אין להעתיק, להפיץ, לשכפל או להשתמש בתכני האתר לכל מטרה מסחרית
              ללא אישור מפורש בכתב מהעמותה.
            </li>
          </ul>

          <h2 className="mt-8">3. ביצוע תרומות באתר</h2>
          <ul className="text-dark leading-[var(--line-height-body)] mt-4 list-disc pr-6 space-y-2">
            <li>
              התרומות באתר מתבצעות באמצעות ספקי סליקה חיצוניים מאובטחים{" "}
              (<strong>Sumit / JGive</strong>).
            </li>
            <li>באחריות התורם להזין פרטים נכונים ומדויקים.</li>
            <li>
              העמותה אינה אחראית לשיבושים שיחלו אצל ספקי הסליקה או חברות
              האשראי.
            </li>
            <li>
              <strong>מדיניות ביטול תרומה: </strong> בהתאם לחוק הגנת הצרכן,
              התשמ&quot;א-1981, תורם רשאי לבקש לבטל תרומה בתוך 30 ימים מיום
              ביצועה, בכפוף להצגת אישור תרומה ופנייה בכתב למייל:{" "}
              <strong>office@tzevethatzolah.com</strong>. העמותה תבצע את הזיכוי
              בהתאם לנהלי חברות האשראי ובקיזוז עמלות סליקה במידה ויחולו.
            </li>
          </ul>

          <h2 className="mt-8">4. הגבלת אחריות</h2>
          <ul className="text-dark leading-[var(--line-height-body)] mt-4 list-disc pr-6 space-y-2">
            <li>
              המידע באתר ניתן כפי שהוא (<strong>As-Is</strong>). העמותה עושה
              מאמצים להבטיח שהמידע יהיה מדויק ומעודכן, אך אינה אחראית לטעויות,
              השמטות או נזקים ישירים או עקיפים שייגרמו כתוצאה מהשימוש באתר.
            </li>
            <li>
              האתר עשוי להכיל קישורים לאתרים חיצוניים. העמותה אינה אחראית לתוכן
              אתרים אלו או למדיניות הפרטיות שלהם.
            </li>
            <li>
              העמותה אינה מתחייבת שהאתר יפעל ללא הפרעות, תקלות או וירוסים, והיא
              לא תהיה אחראית לכל נזק טכני שייגרם למחשב המשתמש.
            </li>
          </ul>

          <h2 className="mt-8">5. שימוש נאות באתר</h2>
          <p className="text-dark leading-[var(--line-height-body)] mt-4">
            המשתמש מתחייב שלא לעשות באתר שימוש שיש בו כדי:
          </p>
          <ul className="text-dark leading-[var(--line-height-body)] mt-4 list-disc pr-6 space-y-2">
            <li>להפר כל חוק או תקנה.</li>
            <li>
              לפגוע בפרטיותם של משתמשים אחרים או של עובדי/מתנדבי העמותה.
            </li>
            <li>
              להעלות תוכן פוגעני, מאיים או לא חוקי דרך טפסי יצירת הקשר.
            </li>
            <li>לנסות לפרוץ למערכות האתר או לשבש את פעילותו.</li>
          </ul>

          <h2 className="mt-8">6. סמכות שיפוט</h2>
          <p className="text-dark leading-[var(--line-height-body)] mt-4">
            על תנאי שימוש אלו יחולו אך ורק דיני מדינת ישראל. מקום השיפוט הבלעדי
            לכל עניין הנוגע להסכם זה יהיה בבתי המשפט המוסמכים במחוז ירושלים (או
            המחוז בו רשומה העמותה).
          </p>
        </div>
      </section>
    </main>
  );
}

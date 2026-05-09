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
          <h2>מדיניות פרטיות – צוות הצלה</h2>
          <p className="text-dark leading-[var(--line-height-body)] mt-4">
            ארגון &quot;צוות הצלה - עזרה ראשונה בישראל&quot; (להלן: <strong>&quot;העמותה&quot;</strong>) מכבד את פרטיות המשתמשים באתר
            (להלן: <strong>&quot;האתר&quot;</strong>). מסמך זה מפרט את הדרך שבה העמותה אוספת, משתמשת
            ומגינה על המידע שנמסר לה.
          </p>

          <h2 className="mt-8">1. המידע שאנו אוספים</h2>
          <p className="text-dark leading-[var(--line-height-body)] mt-4">
            אנו עשויים לאסוף שני סוגי מידע:
          </p>
          <ul className="text-dark leading-[var(--line-height-body)] mt-4 list-disc pr-6 space-y-2">
            <li>
              <strong>מידע אישי שנמסר מרצון: </strong> בעת מילוי טופס יצירת קשר או ביצוע תרומה, אתם עשויים להתבקש למסור פרטים כגון שם מלא, כתובת דוא&quot;ל, מספר טלפון, כתובת למשלוח קבלות וכן <strong>מספר זהות (הנדרש על פי חוק לצורך הנפקת קבלה המוכרת לצרכי מס לפי סעיף 46).</strong>
            </li>
            <li>
              <strong>מידע טכני:</strong> האתר משתמש בכלי אנליטיקה (כגון Google
              Analytics) האוספים מידע אנונימי על אופן השימוש באתר, סוג הדפדפן,
              וכתובת IP, וזאת לצורך שיפור חוויית המשתמש.
            </li>
          </ul>

          <h2 className="mt-8">2. השימוש במידע</h2>
          <p className="text-dark leading-[var(--line-height-body)] mt-4">
            המידע שנאסף ישמש למטרות הבאות:
          </p>
          <ul className="text-dark leading-[var(--line-height-body)] mt-4 list-disc pr-6 space-y-2">
            <li>מתן מענה לפניות שלכם ויצירת קשר.</li>
            <li>משלוח קבלות ואישורים על תרומות.</li>
            <li>שיפור ותפעול האתר.</li>
            <li>
              במידה ונתתם את הסכמתכם לכך – שליחת עדכונים על פעילות העמותה (ניתן
              להסיר את עצמכם מרשימת התפוצה בכל עת).
            </li>
          </ul>

          <h2 className="mt-8">3. העברת מידע לצדדים שלישיים</h2>
          <p className="text-dark leading-[var(--line-height-body)] mt-4">
            העמותה לא תמכור או תשכיר את המידע האישי שלכם לצדדים שלישיים. מידע
            יועבר לצד שלישי רק במקרים הבאים:
          </p>
          <ul className="text-dark leading-[var(--line-height-body)] mt-4 list-disc pr-6 space-y-2">
            <li>
              לצורך השלמת תהליך התרומה (ספקי סליקה חיצוניים כגון <strong>Sumit / JGive</strong>).
            </li>
            <li>במידה ונדרש על פי חוק או צו שיפוטי.</li>
          </ul>

          <h2 className="mt-8">4. תרומות ואבטחה</h2>
          <p className="text-dark leading-[var(--line-height-body)] mt-4">
            תהליך הסליקה מתבצע באופן מאובטח באמצעות ספקי תשלום חיצוניים העומדים
            בתקני האבטחה המחמירים ביותר (PCI-DSS). <strong>האתר אינו שומר את פרטי אמצעי
            התשלום שלכם (מספרי כרטיסי אשראי וכיו&quot;ב).</strong>
          </p>

          <h2 className="mt-8">5. עוגיות (Cookies)</h2>
          <p className="text-dark leading-[var(--line-height-body)] mt-4">
            האתר עושה שימוש ב&quot;עוגיות&quot; לצורך תפעולו השוטף ולצורך איסוף נתונים
            סטטיסטיים. ניתן לנטרל את השימוש בעוגיות דרך הגדרות הדפדפן שלכם, אך
            הדבר עשוי להשפיע על חלק מהפונקציות באתר.
          </p>

          <h2 className="mt-8">6. זכויותיכם: עיון ומחיקת מידע</h2>
          <ul className="text-dark leading-[var(--line-height-body)] mt-4 list-disc pr-6 space-y-2">
            <li>
              <strong>תוכן העיון והתיקון:</strong> על פי חוק הגנת הפרטיות,
              התשמ&quot;א-1981, אתם זכאים לעיין במידע המוחזק עליכם ולבקש את
              תיקונו או מחיקתו במידה ונמצא כי המידע אינו נכון, שלם או מעודכן.
            </li>
            <li>
              <strong>בקשת מחיקה:</strong> לבקשת מחיקה של מידע אישי, אנא פנו
              אלינו בכתובת הדוא&quot;ל: <strong>office@tzevethatzolah.com</strong>.
              ונטפל בבקשתכם בשיא היעילות תוך 30 ימי עסקים ממועד קבלתה.
            </li>
            <li>
              <strong>החרגת מחיקה על פי דין:</strong> שימו לב כי בקשת המחיקה לא
              תחול על מידע שהעמותה מחויבת לשמור על פי חוק. בכלל זה, פרטי תורמים
              (לרבות שם ומספר זהות) המופיעים בקבלות ובמסמכי הנהלת חשבונות
              יישמרו למשך התקופה הנדרשת על פי חוק הוראות רשות המיסים (כ-7
              שנים) לצורך ביקורת ודיווח על פי סעיף 46, ולא יימחקו גם אם
              התבקשה מחיקתם.
            </li>
          </ul>

          <h2 className="mt-8">7. שינויים במדיניות</h2>
          <p className="text-dark leading-[var(--line-height-body)] mt-4">
            העמותה שומרת לעצמה את הזכות לעדכן את מדיניות הפרטיות מעת לעת.
            שינויים יפורסמו בעמוד זה.
          </p>

          <h2 className="mt-8">יצירת קשר</h2>
          <p className="text-dark leading-[var(--line-height-body)] mt-4">
            לכל שאלה נוספת, ניתן לפנות אלינו בכתובת המייל המצוינת לעיל.
          </p>
        </div>
      </section>
    </main>
  );
}

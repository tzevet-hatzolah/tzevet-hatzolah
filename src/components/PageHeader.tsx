import Image, { type StaticImageData } from "next/image";

type Props = {
  title: string;
  subtitle?: string;
  /** When set, renders as background photo with a navy overlay. Falls back to the gradient `.page-header` style. */
  image?: string | StaticImageData;
  /** next/image alt — falls back to title. Pass "" for purely decorative banners. */
  imageAlt?: string;
};

export default function PageHeader({ title, subtitle, image, imageAlt }: Props) {
  const hasImage = Boolean(image);

  return (
    <section
      className={`relative text-white text-center overflow-hidden ${
        hasImage ? "" : "page-header"
      } py-12 sm:py-16 md:py-20 px-5 sm:px-6`}
    >
      {hasImage && image && (
        <>
          <Image
            src={image}
            alt={imageAlt ?? title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-navy-950/80 via-navy-800/70 to-navy-950/85" />
        </>
      )}
      <div className="relative z-10 max-w-3xl mx-auto">
        <div className="section-line mx-auto mb-4 sm:mb-5" />
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-[number:var(--font-weight-black)] drop-shadow-sm">
          {title}
        </h1>
        {subtitle && (
          <p className="text-white/70 text-sm sm:text-base mt-3 max-w-xl mx-auto">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}

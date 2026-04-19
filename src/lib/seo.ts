import type { Metadata } from "next";

type Alternates = NonNullable<Metadata["alternates"]>;

// Build hreflang alternates for a given unprefixed path (e.g. "/about").
// Hebrew lives at root; English at /en/*. x-default points to Hebrew.
export function alternateLinks(path: string): Alternates {
  const hePath = path === "/" ? "/" : path;
  const enPath = path === "/" ? "/en" : `/en${path}`;
  return {
    canonical: hePath,
    languages: {
      he: hePath,
      en: enPath,
      "x-default": hePath,
    },
  };
}

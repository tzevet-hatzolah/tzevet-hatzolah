import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export function proxy(request: import("next/server").NextRequest) {
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Match all paths except internals, static assets, and Sanity studio
    "/((?!api|_next/static|_next/image|studio|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)",
  ],
};

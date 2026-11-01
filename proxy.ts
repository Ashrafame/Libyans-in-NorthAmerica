import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_FILE = /\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json|webmanifest|woff2?)$/i;
const LOCALES = ["en", "ar"];

function localeFromPath(pathname: string): string | null {
  const first = pathname.split("/")[1];
  return LOCALES.includes(first) ? first : null;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/admin") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const locale = localeFromPath(pathname);
  if (!locale) {
    const saved = request.cookies.get("lna_locale")?.value;
    const target = LOCALES.includes(saved ?? "") ? saved : "en";
    const url = request.nextUrl.clone();
    url.pathname = `/${target}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  // Members-only routes: a cookie check here is only a fast redirect; pages verify the session.
  if (pathname.startsWith(`/${locale}/members`)) {
    const hasSession = Boolean(
      request.cookies.get("lna_member")?.value ||
        request.cookies
          .getAll()
          .some((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")),
    );
    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      url.search = `?next=${encodeURIComponent(pathname + search)}`;
      return NextResponse.redirect(url);
    }
  }

  const headers = new Headers(request.headers);
  headers.set("x-lna-locale", locale);
  headers.set("x-lna-pathname", pathname);
  const response = NextResponse.next({ request: { headers } });
  response.cookies.set("lna_locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};

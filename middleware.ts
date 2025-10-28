import {NextResponse} from "next/server";
import { locales } from './src/i18n/config';

type Locale = (typeof locales)[number];

// Helper: check if pathname starts with any supported locale
function hasLocale(pathname: string) {
  return locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
}

export function middleware(request: Request) {
  const url = new URL(request.url);
  const {pathname} = url;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const headers = (request as any).headers;
  const cookieHeader: string = headers?.get?.('cookie') || '';

  // Ignore Next internal and asset paths early
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }

  // 1. Handle bare alias paths before locale insertion (e.g., /signup -> /sign-up)
  let adjustedPathname = pathname;
  if (adjustedPathname === '/signup') adjustedPathname = '/sign-up';

  // 2. Ensure locale prefix
  if (!hasLocale(adjustedPathname)) {
    // Try lang cookie
    const cookieLangMatch = cookieHeader.match(/(?:^|;\s*)lang=(en|ar)(?:;|$)/i);
    const cookieLang = cookieLangMatch?.[1]?.toLowerCase();
    // Fallback Accept-Language
    const accept = headers?.get?.('accept-language') || '';
    const headerLang = accept.split(',')[0]?.split('-')[0]?.toLowerCase();
    let locale: Locale = 'en';
    if (cookieLang && (locales as readonly string[]).includes(cookieLang)) locale = cookieLang as Locale;
    else if (headerLang && (locales as readonly string[]).includes(headerLang)) locale = headerLang as Locale;
    url.pathname = `/${locale}${adjustedPathname.startsWith('/') ? adjustedPathname : '/' + adjustedPathname}`;
    return NextResponse.redirect(url);
  }

  // At this point path has /:lang/...; perform auth gating if needed.
  // Note: JWT authentication is handled by the http service and client-side,
  // so we no longer need to check for auth cookies in middleware.
  const chatMatch = pathname.match(/^(?:\/(en|ar))\/chat\/?$/);
  if (chatMatch) {
    // Always redirect legacy /:lang/chat to /:lang now that chat is root page
    url.pathname = `/${chatMatch[1]}`;
    return NextResponse.redirect(url);
  }
  // Auth gating now applies to root page, but we allow landing even if not logged in and gate inside component.

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt|xml|map)$).*)"],
};

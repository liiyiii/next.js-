import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_FILE = /\.(.*)$/;
export const SUPPORTED_LANGUAGES = ['en', 'zh'];
export const DEFAULT_LANGUAGE = 'en';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public files, _next paths, and API routes
  if (
    PUBLIC_FILE.test(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') // Assuming /static for public assets not caught by PUBLIC_FILE
  ) {
    return NextResponse.next();
  }

  const pathnameIsMissingLocale = SUPPORTED_LANGUAGES.every(
    (lang) => !pathname.startsWith(`/${lang}/`) && pathname !== `/${lang}`
  );

  if (pathnameIsMissingLocale) {
    let locale = DEFAULT_LANGUAGE;

    // Optional: Try to get language from Accept-Language header
    // const acceptLanguage = request.headers.get('accept-language');
    // if (acceptLanguage) {
    //   // Basic parsing, a library like `accept-language-parser` is more robust
    //   const preferredLang = acceptLanguage.split(',')[0].split('-')[0].toLowerCase();
    //   if (SUPPORTED_LANGUAGES.includes(preferredLang)) {
    //     locale = preferredLang;
    //   }
    // }

    // Rewrite to include the locale in the path
    // e.g. incoming request is /products -> rewritten to /en/products
    // e.g. incoming request is / -> rewritten to /en
    const newPathname = `/${locale}${pathname === '/' ? '' : pathname}`;

    return NextResponse.rewrite(
      new URL(newPathname, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  // Matcher ignoring `/_next/` and `/api/` and files with extensions
  matcher: [
    '/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js).*)',
  ],
};

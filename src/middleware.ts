import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { APP_CONFIG, MIDDLEWARE_CONFIG, ROUTES } from '@/utils/constants';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    MIDDLEWARE_CONFIG.PUBLIC_FILE_EXTENSIONS.some((ext) =>
      pathname.endsWith(ext),
    )
  ) {
    return NextResponse.next();
  }

  const isPublicRoute = MIDDLEWARE_CONFIG.PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  const token =
    request.cookies.get(APP_CONFIG.COOKIE_NAME) ||
    request.cookies.get(APP_CONFIG.COOKIE_SECURE_NAME);

  if (!isPublicRoute && !token) {
    const loginUrl = new URL(ROUTES.LOGIN, request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

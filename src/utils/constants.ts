const parseNumber = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const APP_CONFIG = {
  TOKEN_KEY: 'auth-storage',
  COOKIE_NAME: 'next-auth.session-token',
  COOKIE_SECURE_NAME: '__Secure-next-auth.session-token',
  DEFAULT_TOAST_DURATION: 3000,
  ENABLE_MOCKS: process.env.NEXT_PUBLIC_ENABLE_MOCKS === 'true',
};

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  REQUEST_TIMEOUT_MS: parseNumber(process.env.NEXT_PUBLIC_REQUEST_TIMEOUT_MS, 10000),
};

export const AUTH_CONFIG = {
  LOGIN_EXPIRED_REASON: 'expired',
  COOKIE_MAX_AGE_SECONDS: 60 * 60 * 24,
  POST_LOGIN_REDIRECT_DELAY_MS: 100,
};

export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
  POST_UPLOAD_SUCCESS_DELAY_MS: 1500,
};

export const MOCK_CONFIG = {
  MUTATION_DELAY_MS: 800,
  QUERY_DELAY_MS: 600,
  SELECTION_SUBMIT_DELAY_MS: 500,
};

export const MIDDLEWARE_CONFIG = {
  PUBLIC_FILE_EXTENSIONS: ['.html', '.css', '.js', '.png', '.jpg', '.svg'],
  PUBLIC_ROUTES: ['/login', '/register', '/api/auth'],
  MATCHER: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

export const PAGE_CONFIG = {
  PAGE_HEIGHT: 800,
  BUFFER: 2,
};

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  DOCUMENTS: '/documents',
  UPLOAD: '/documents/upload',
  WORKSPACE: '/workspace',
  SETTINGS: '/settings',
};

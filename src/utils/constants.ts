export const APP_CONFIG = {
  TOKEN_KEY: "auth-storage",
  COOKIE_NAME: "next-auth.session-token",
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  DEFAULT_TOAST_DURATION: 3000,
  ENABLE_MOCKS: process.env.NEXT_PUBLIC_ENABLE_MOCKS === "true", // Toggle via .env
};

export const ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  DOCUMENTS: "/documents",
  UPLOAD: "/documents/upload",
  WORKSPACE: "/workspace",
  SETTINGS: "/settings",
};

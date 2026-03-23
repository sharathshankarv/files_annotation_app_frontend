import axios, { InternalAxiosRequestConfig } from "axios";
import { getCookie, deleteCookie } from "cookies-next";
import { useAuthStore } from "@/store/useAuthStore";
import { APP_CONFIG, ROUTES } from "@/utils/constants";
import { isTokenExpired } from "./auth-util";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 🛡️ Robust-Proof: Don't let requests hang forever
});

const handleUnauthorized = () => {
  useAuthStore.getState().logout();
  deleteCookie(APP_CONFIG.COOKIE_NAME);

  if (typeof window !== "undefined") {
    // 🛡️ Use the constant, not a hardcoded string
    window.location.href = `${ROUTES.LOGIN}?reason=expired`;
  }
};

/**
 * 🛡️ SINGLE REQUEST INTERCEPTOR
 * Handles Authentication and Request Formatting in one pass.
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 🛡️ Explicitly define the type to resolve the TS2345 error
    const cookieToken = getCookie(APP_CONFIG.COOKIE_NAME) as string | null;
    const storeToken = useAuthStore.getState().token;
    const activeToken = storeToken || cookieToken;

    // 🛡️ Circuit Breaker
    if (activeToken && isTokenExpired(activeToken)) {
      useAuthStore.getState().logout();
      deleteCookie(APP_CONFIG.COOKIE_NAME);
      if (typeof window !== "undefined") {
        handleUnauthorized();
      }
      return Promise.reject(new Error("Token expired"));
    }

    if (activeToken && config.headers) {
      config.headers.Authorization = `Bearer ${activeToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * 🛡️ TERMINAL RESPONSE INTERCEPTOR
 * The "Final Word" on Session Integrity.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // 🛡️ 401 = Token Expired or Invalid
    // No retry logic here because an expired token will NEVER succeed on retry.
    if (status === 401) {
      console.warn("🚨 Auth: Session expired. Cleaning up...");

      // 1. Wipe Zustand Store
      useAuthStore.getState().logout();

      // 2. Wipe Browser Cookies
      deleteCookie(APP_CONFIG.COOKIE_NAME);

      // 3. Hard Redirect to clear React memory state
      if (typeof window !== "undefined") {
        handleUnauthorized();
      }
    }

    // 🛡️ 403 = Forbidden (Authenticated but no permission)
    if (status === 403) {
      console.error(
        "🚫 Access Denied: You do not have permission for this action.",
      );
    }

    return Promise.reject(error);
  },
);

import { getCookie } from "cookies-next";
import { APP_CONFIG } from "@/utils/constants";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = getCookie(APP_CONFIG.COOKIE_NAME);

  // 🛡️ Principal Tip: If there's no token in the cookie,
  // don't even bother rendering the Dashboard or calling /me.
  if (!token) {
    return null; // The Middleware/Proxy will handle the redirect
  }

  return <>{children}</>;
}

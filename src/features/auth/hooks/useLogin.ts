import { useAppMutation } from "@/lib/mutation-factory";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { LoginResponse, LoginCredentials } from "../types";
import { APP_CONFIG } from "@/utils/constants";
import { setCookie } from "cookies-next";
import { useAuthStore } from "@/store/useAuthStore";
import { useNavigator } from "@/hooks/use-navigator";

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigator();

  return useAppMutation<LoginResponse, LoginCredentials>(
    API_ENDPOINTS.AUTH.LOGIN,
    "POST",
    {
      onSuccess: (data) => {
        // 1. Sync Client-Side State (Zustand)
        setAuth(data.user, data.access_token);

        // 2. Sync Edge/Server-Side State (Middleware)
        setCookie(APP_CONFIG.COOKIE_NAME, data.access_token, {
          maxAge: 60 * 60 * 24, // 24 hours
          path: "/",
          // Secure only in production to allow local testing
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });

        setTimeout(() => {
          navigate.goToDashboard();
        }, 100);
      },
    },
  );
};

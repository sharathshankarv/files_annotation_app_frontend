import { useAuthStore } from "@/store/useAuthStore";
import { deleteCookie } from "cookies-next";
import { APP_CONFIG, ROUTES } from "@/utils/constants";
import { useNavigator } from "@/hooks/use-navigator";

export const useLogout = () => {
  const logout = useAuthStore((state) => state.logout);
  const { goToLogin } = useNavigator();

  const handleLogout = () => {
    logout(); // Clear Zustand
    deleteCookie(APP_CONFIG.COOKIE_NAME); // Clear Middleware Gate
    goToLogin();
  };

  return { handleLogout };
};

"use client";

import { useRouter } from "next/navigation";
import { ROUTES } from "@/utils/constants";

/**
 * Principal-level Navigation Wrapper
 * Centralizes all routing logic. If we switch frameworks or add
 * global route logging, we only change it here.
 */
export function useNavigator() {
  const router = useRouter();

  return {
    goToDashboard: () => router.push(ROUTES.DASHBOARD),
    goToUpload: () => router.push(ROUTES.UPLOAD),
    goToLogin: () => router.replace(ROUTES.LOGIN),
    goBack: () => router.back(),
    // Type-safe dynamic routing
    goToDocument: (id: string) => router.push(`${ROUTES.WORKSPACE}/${id}`),
    native: router,
  };
}

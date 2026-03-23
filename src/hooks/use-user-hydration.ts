import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api-endpoints";

export function useUserHydration() {
  const { user, token, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  // 🛡️ Principal Strategy: The Network Lock
  // This ref ensures that even if the component re-renders 10 times,
  // the 'api.get' is only triggered ONCE per mount.
  const fetchStarted = useRef(false);

  useEffect(() => {
    const hydrate = async () => {
      // 🛡️ Logic Gate: Stop if we already have a user, no token, or a fetch is in progress
      if (user || !token || fetchStarted.current) return;

      fetchStarted.current = true;
      setIsLoading(true);

      try {
        const { data } = await api.get(API_ENDPOINTS.AUTH.ME);
        setUser(data);
      } catch (error) {
        // Log to Splunk here later
        console.error("User hydration failed", error);
      } finally {
        setIsLoading(true); // Keep true until logic settles, or set to false
        setIsLoading(false);
      }
    };

    hydrate();
  }, [token, user, setUser]);

  return {
    user,
    isLoading,
  };
}

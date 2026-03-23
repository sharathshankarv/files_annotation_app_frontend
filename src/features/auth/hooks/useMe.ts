import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api-client";
import { User } from "@/types";

export const useMe = () => {
  const { token, user, setUser } = useAuthStore();

  return useQuery({
    queryKey: ["me", user?.id],
    queryFn: async () => {
      const { data } = await api.get<User>(API_ENDPOINTS.AUTH.ME);
      // Sync the fetched data back to Zustand
      setUser(data);
      return data;
    },
    enabled: !!token,
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });
};

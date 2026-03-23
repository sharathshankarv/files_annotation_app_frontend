import { useQuery, UseQueryOptions, QueryKey } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { ApiAxiosError } from "@/types/api";
import { APP_CONFIG } from "@/utils/constants";

interface ExtraOptions<TData> {
  mock?: TData;
}

export function useAppQuery<TData>(
  queryKey: QueryKey,
  url: string,
  options?: Omit<
    UseQueryOptions<TData, ApiAxiosError>,
    "queryKey" | "queryFn"
  > &
    ExtraOptions<TData>,
) {
  return useQuery<TData, ApiAxiosError>({
    queryKey,
    queryFn: async () => {
      // 1. Global Mock Logic
      if (APP_CONFIG.ENABLE_MOCKS && options?.mock) {
        await new Promise((resolve) => setTimeout(resolve, 600)); // Simulating lag
        return options.mock;
      }

      // 2. Real API Call
      const { data } = await api.get<TData>(url);
      return data;
    },
    ...options,
  });
}
